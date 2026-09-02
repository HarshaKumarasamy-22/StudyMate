from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document import Document
from app.models.study import ChatMessage, FlashcardSet, Quiz
from app.models.user import User
from app.schemas.study import (
    ChatMessageResponse,
    ChatQueryRequest,
    ChatResponse,
    FlashcardGenerateRequest,
    FlashcardSetResponse,
    QuizGenerateRequest,
    QuizResponse,
    QuizScoreResult,
    QuizSubmitRequest,
)
from app.services.study_service import (
    ask_document_question,
    generate_flashcards,
    generate_quiz,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/study", tags=["AI Study Assistant"])


def _get_user_document(db: Session, document_id: int, user_id: int) -> Document:
    """Helper to verify document ownership."""
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == user_id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return doc


# ==========================================
# 💬 AI RAG Chat Endpoints
# ==========================================


@router.post(
    "/{document_id}/chat",
    response_model=ChatResponse,
    summary="Ask an AI question about a specific document",
)
def chat_with_document(
    document_id: int,
    query_in: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Query the document using RAG: Vector search retrieves relevant context,
    and OpenAI generates an answer with page citations.
    """
    doc = _get_user_document(db, document_id, current_user.id)
    try:
        result = ask_document_question(
            db=db,
            document=doc,
            user_id=current_user.id,
            question=query_in.question,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing AI query: {str(e)}",
        )


@router.get(
    "/{document_id}/chat/history",
    response_model=List[ChatMessageResponse],
    summary="Get chat conversation history for a document",
)
def get_chat_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve chronologically ordered chat messages for this document."""
    _get_user_document(db, document_id, current_user.id)
    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.document_id == document_id,
            ChatMessage.user_id == current_user.id,
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return messages


@router.delete(
    "/{document_id}/chat/history",
    status_code=status.HTTP_200_OK,
    summary="Clear chat history for a document",
)
def clear_chat_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all chat messages for a specific document."""
    _get_user_document(db, document_id, current_user.id)
    db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"message": "Chat history cleared successfully."}


# ==========================================
# 📝 Interactive Quiz Endpoints
# ==========================================


@router.post(
    "/{document_id}/quiz/generate",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate an AI multiple-choice quiz from document content",
)
def create_quiz(
    document_id: int,
    req: QuizGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a structured MCQ quiz with explanations."""
    doc = _get_user_document(db, document_id, current_user.id)
    try:
        quiz = generate_quiz(
            db=db,
            document=doc,
            user_id=current_user.id,
            num_questions=req.num_questions,
            difficulty=req.difficulty or "medium",
        )
        return quiz
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}",
        )


@router.get(
    "/{document_id}/quizzes",
    response_model=List[QuizResponse],
    summary="List all quizzes generated for a document",
)
def list_quizzes(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all previously generated quizzes for this document."""
    _get_user_document(db, document_id, current_user.id)
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.document_id == document_id, Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )
    return quizzes


@router.get(
    "/quizzes/{quiz_id}",
    response_model=QuizResponse,
    summary="Get a specific quiz by ID",
)
def get_quiz_by_id(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve quiz questions and details."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )
    return quiz


@router.post(
    "/quizzes/{quiz_id}/submit",
    response_model=QuizScoreResult,
    summary="Submit answers and calculate score for a quiz",
)
def submit_quiz_answers(
    quiz_id: int,
    submission: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grade submitted answers and return score percentage and explanations."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    questions = quiz.questions or []
    correct_count = 0
    review: list[dict] = []

    for idx, q in enumerate(questions):
        selected_option = submission.answers.get(idx) or submission.answers.get(str(idx))
        correct_answer = q.get("answer")
        is_correct = selected_option == correct_answer

        if is_correct:
            correct_count += 1

        review.append(
            {
                "question_index": idx,
                "question": q.get("question"),
                "selected_answer": selected_option,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": q.get("explanation"),
            }
        )

    total = len(questions)
    percentage = (correct_count / total * 100) if total > 0 else 0.0

    return QuizScoreResult(
        total_questions=total,
        correct_count=correct_count,
        score_percentage=round(percentage, 1),
        review=review,
    )


# ==========================================
# 🎴 Flashcards Endpoints
# ==========================================


@router.post(
    "/{document_id}/flashcards/generate",
    response_model=FlashcardSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate study flashcards from document content",
)
def create_flashcards(
    document_id: int,
    req: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate key terms and definitions flashcard deck."""
    doc = _get_user_document(db, document_id, current_user.id)
    try:
        flashcards = generate_flashcards(
            db=db,
            document=doc,
            user_id=current_user.id,
            num_cards=req.num_cards,
        )
        return flashcards
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate flashcards: {str(e)}",
        )


@router.get(
    "/{document_id}/flashcards",
    response_model=List[FlashcardSetResponse],
    summary="List all flashcard decks for a document",
)
def list_flashcard_sets(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all flashcard sets created for this document."""
    _get_user_document(db, document_id, current_user.id)
    sets = (
        db.query(FlashcardSet)
        .filter(
            FlashcardSet.document_id == document_id,
            FlashcardSet.user_id == current_user.id,
        )
        .order_by(FlashcardSet.created_at.desc())
        .all()
    )
    return sets


@router.get(
    "/flashcards/{flashcard_id}",
    response_model=FlashcardSetResponse,
    summary="Get a specific flashcard deck by ID",
)
def get_flashcard_set_by_id(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve flashcard set cards and details."""
    card_set = (
        db.query(FlashcardSet)
        .filter(FlashcardSet.id == flashcard_id, FlashcardSet.user_id == current_user.id)
        .first()
    )
    if not card_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard set not found.",
        )
    return card_set
