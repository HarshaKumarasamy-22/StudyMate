import json
from typing import Any, List
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentChunk
from app.models.study import ChatMessage, FlashcardSet, Quiz
from app.services.vector_service import get_llm_client, get_single_embedding, search_similar_chunks


def ask_document_question(
    db: Session,
    document: Document,
    user_id: int,
    question: str,
) -> dict[str, Any]:
    """
    RAG QA pipeline for a single document.
    """
    similar_chunks = search_similar_chunks(db, document.id, question, top_k=4)

    context_parts: list[str] = []
    sources: list[dict[str, Any]] = []

    for chunk in similar_chunks:
        page_info = f" [Page {chunk.page_number}]" if chunk.page_number else ""
        context_parts.append(f"--- Document Content{page_info} ---\n{chunk.content}")
        sources.append(
            {
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "content": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
            }
        )

    context_text = "\n\n".join(context_parts) if context_parts else "No specific context found."

    system_prompt = (
        "You are StudyMate, an expert, encouraging, and clear AI study assistant. "
        "Answer the student's question accurately using ONLY the provided document context whenever possible. "
        "If the answer is found in the context, cite relevant page numbers or concepts clearly. "
        "Use markdown formatting with bullet points, bold key terms, and concise paragraphs for high readability. "
        "If the document doesn't contain the answer, politely state that it's not in the document and provide a brief helpful explanation."
    )

    user_prompt = f"Document Title: {document.title}\n\nContext:\n{context_text}\n\nQuestion: {question}"

    client, model_name = get_llm_client()
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    answer = response.choices[0].message.content or "No response generated."

    # Save to ChatMessage table
    user_msg = ChatMessage(
        user_id=user_id,
        document_id=document.id,
        role="user",
        content=question,
        sources=None,
    )
    assistant_msg = ChatMessage(
        user_id=user_id,
        document_id=document.id,
        role="assistant",
        content=answer,
        sources=sources,
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    return {"answer": answer, "sources": sources}


def multi_document_chat(
    db: Session,
    user_id: int,
    question: str,
    top_k: int = 6,
) -> dict[str, Any]:
    """
    Cross-document RAG search: Searches across ALL documents owned by the user.
    """
    query_vector = get_single_embedding(question)

    # Search top chunks across all user documents
    chunks = (
        db.query(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(Document.user_id == user_id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
        .all()
    )

    context_parts: list[str] = []
    sources: list[dict[str, Any]] = []

    for chunk, doc in chunks:
        page_info = f" (Page {chunk.page_number})" if chunk.page_number else ""
        context_parts.append(f"--- Document: {doc.title}{page_info} ---\n{chunk.content}")
        sources.append(
            {
                "document_id": doc.id,
                "document_title": doc.title,
                "page_number": chunk.page_number,
                "content": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
            }
        )

    context_text = "\n\n".join(context_parts) if context_parts else "No specific documents or context found."

    system_prompt = (
        "You are StudyMate Global AI. You search and answer across the student's entire library of study documents. "
        "Synthesize an answer using the provided context chunks. ALWAYS cite the exact Document Title and Page Number for each fact. "
        "Format with clear headings, bullet points, and highlight connections between different documents when relevant."
    )

    user_prompt = f"Context from Student's Library:\n{context_text}\n\nGlobal Question: {question}"

    client, model_name = get_llm_client()
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    answer = response.choices[0].message.content or "No response generated."

    return {"answer": answer, "sources": sources}


def summarize_document(
    db: Session,
    document: Document,
    user_id: int,
) -> dict[str, Any]:
    """
    Generate a comprehensive structured summary of a document.
    """
    # Check if cached summary already exists
    if document.summary:
        return document.summary

    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.chunk_index.asc())
        .limit(12)
        .all()
    )

    if not chunks:
        raise ValueError("Document has no text content to summarize.")

    sample_text = "\n\n".join([f"Page {c.page_number}: {c.content}" for c in chunks])

    system_prompt = (
        "You are an academic summarization engine. Create a high quality structured study summary "
        "of the provided document content. Return JSON strictly in the following format:\n"
        "{\n"
        '  "executive_summary": "A clear, concise 2-3 paragraph overview of the core topic.",\n'
        '  "key_concepts": ["Concept 1: Definition", "Concept 2: Formula/Principle", "Concept 3: ..."],\n'
        '  "takeaways": ["High yield exam point 1", "Key takeaway 2", "Important distinction 3"],\n'
        '  "sections": [\n'
        '    {"title": "Section Title 1", "content": "Summary of section 1..."},\n'
        '    {"title": "Section Title 2", "content": "Summary of section 2..."}\n'
        "  ]\n"
        "}"
    )

    user_prompt = f"Document Title: {document.title}\n\nContent:\n{sample_text}"

    client, model_name = get_llm_client()
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    raw_json = response.choices[0].message.content
    summary_data = json.loads(raw_json)
    summary_data["document_id"] = document.id

    # Cache summary in document record
    document.summary = summary_data
    db.commit()

    return summary_data


def generate_quiz(
    db: Session,
    document: Document,
    user_id: int,
    num_questions: int = 5,
    difficulty: str = "medium",
) -> Quiz:
    """
    Generate an interactive multiple-choice quiz based on document content.
    """
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.chunk_index.asc())
        .limit(10)
        .all()
    )

    if not chunks:
        raise ValueError("Document has no indexed text chunks to generate a quiz from.")

    sample_text = "\n\n".join([f"Page {c.page_number}: {c.content}" for c in chunks])

    system_prompt = (
        "You are an expert exam creator. Generate a high quality multiple choice quiz "
        "based strictly on the document text provided. Return JSON strictly in the following format:\n"
        "{\n"
        '  "title": "Quiz Title",\n'
        '  "questions": [\n'
        "    {\n"
        '      "question": "Question text?",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "answer": "Option A",\n'
        '      "explanation": "Brief explanation of why Option A is correct."\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    user_prompt = (
        f"Document: {document.title}\n"
        f"Difficulty: {difficulty}\n"
        f"Number of questions: {num_questions}\n\n"
        f"Content:\n{sample_text}"
    )

    client, model_name = get_llm_client()
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )

    raw_json = response.choices[0].message.content
    quiz_data = json.loads(raw_json)

    quiz_record = Quiz(
        user_id=user_id,
        document_id=document.id,
        title=quiz_data.get("title", f"{document.title} - Quiz"),
        questions=quiz_data.get("questions", []),
    )
    db.add(quiz_record)
    db.commit()
    db.refresh(quiz_record)

    return quiz_record


def generate_flashcards(
    db: Session,
    document: Document,
    user_id: int,
    num_cards: int = 8,
) -> FlashcardSet:
    """
    Generate study flashcards from document content.
    """
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.chunk_index.asc())
        .limit(10)
        .all()
    )

    if not chunks:
        raise ValueError("Document has no indexed text chunks to generate flashcards from.")

    sample_text = "\n\n".join([f"Page {c.page_number}: {c.content}" for c in chunks])

    system_prompt = (
        "You are an active recall study tutor. Extract the most important concepts, terms, and key formulas "
        "from the provided document content and format them as flashcards. Return JSON strictly in the format:\n"
        "{\n"
        '  "title": "Flashcards Set Title",\n'
        '  "cards": [\n'
        "    {\n"
        '      "front": "Key Concept / Question / Term",\n'
        '      "back": "Clear definition, formula, or concise explanation"\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    user_prompt = (
        f"Document: {document.title}\n"
        f"Number of cards: {num_cards}\n\n"
        f"Content:\n{sample_text}"
    )

    client, model_name = get_llm_client()
    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )

    raw_json = response.choices[0].message.content
    flashcard_data = json.loads(raw_json)

    flashcard_set = FlashcardSet(
        user_id=user_id,
        document_id=document.id,
        title=flashcard_data.get("title", f"{document.title} - Flashcards"),
        cards=flashcard_data.get("cards", []),
    )
    db.add(flashcard_set)
    db.commit()
    db.refresh(flashcard_set)

    return flashcard_set
