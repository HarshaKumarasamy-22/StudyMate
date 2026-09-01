import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.document import Document, DocumentChunk
from app.models.user import User
from app.schemas.document import DocumentDetailResponse, DocumentResponse
from app.services.pdf_service import extract_text_and_chunks
from app.services.vector_service import get_embeddings_batch
from app.utils.deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])


@router.post(
    "/upload",
    response_model=DocumentDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF study document, extract text, and index vector embeddings",
)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a study document (PDF), parse pages, generate OpenAI vector embeddings,
    and save chunks to PostgreSQL with pgvector for instant RAG search.
    """
    # Validate file extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported at this time.",
        )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Generate unique filename to avoid collision
    unique_id = uuid.uuid4().hex[:8]
    sanitized_filename = f"{unique_id}_{file.filename}"
    saved_file_path = os.path.join(settings.UPLOAD_DIR, sanitized_filename)

    # Save uploaded file
    try:
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )

    # Check file size
    file_size = os.path.getsize(saved_file_path)
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        if os.path.exists(saved_file_path):
            os.remove(saved_file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed limit ({settings.MAX_FILE_SIZE_MB}MB).",
        )

    # Extract text & generate chunks
    try:
        num_pages, chunks_data = extract_text_and_chunks(saved_file_path)
    except Exception as e:
        if os.path.exists(saved_file_path):
            os.remove(saved_file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse PDF content: {str(e)}",
        )

    if not chunks_data:
        if os.path.exists(saved_file_path):
            os.remove(saved_file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF does not contain extractable text.",
        )

    # Generate Vector Embeddings (if OPENAI_API_KEY is configured)
    chunk_texts = [c["content"] for c in chunks_data]
    embeddings: list[list[float]] = []

    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your-openai-api-key-here":
        try:
            embeddings = get_embeddings_batch(chunk_texts)
        except Exception as e:
            if os.path.exists(saved_file_path):
                os.remove(saved_file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating OpenAI embeddings: {str(e)}",
            )
    else:
        # Fallback empty embeddings if key is not yet set (allows dev testing)
        embeddings = [None] * len(chunks_data)

    # Create Document record
    doc_title = title.strip() if title and title.strip() else file.filename.replace(".pdf", "").replace(".PDF", "")
    new_doc = Document(
        user_id=current_user.id,
        title=doc_title,
        filename=file.filename,
        file_path=saved_file_path,
        file_size=file_size,
        num_pages=num_pages,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # Save Document Chunks with vector embeddings
    chunk_objects = [
        DocumentChunk(
            document_id=new_doc.id,
            chunk_index=chunk["chunk_index"],
            page_number=chunk["page_number"],
            content=chunk["content"],
            embedding=embeddings[i] if i < len(embeddings) else None,
        )
        for i, chunk in enumerate(chunks_data)
    ]
    db.bulk_save_objects(chunk_objects)
    db.commit()

    return DocumentDetailResponse(
        id=new_doc.id,
        user_id=new_doc.user_id,
        title=new_doc.title,
        filename=new_doc.filename,
        file_size=new_doc.file_size,
        num_pages=new_doc.num_pages,
        created_at=new_doc.created_at,
        updated_at=new_doc.updated_at,
        total_chunks=len(chunk_objects),
    )


@router.get(
    "/",
    response_model=List[DocumentResponse],
    summary="List all uploaded documents for current user",
)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all study documents owned by the currently authenticated user."""
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs


@router.get(
    "/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Get document details by ID",
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a specific document's metadata and chunk count."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    chunk_count = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == doc.id)
        .count()
    )

    return DocumentDetailResponse(
        id=doc.id,
        user_id=doc.user_id,
        title=doc.title,
        filename=doc.filename,
        file_size=doc.file_size,
        num_pages=doc.num_pages,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        total_chunks=chunk_count,
    )


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a document and its indexed vectors",
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document, its database records/embeddings, and stored physical file."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # Delete physical file from disk if exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    # Delete from DB (cascades to chunks, quizzes, flashcards)
    db.delete(doc)
    db.commit()

    return {"message": "Document and all related study materials successfully deleted."}
