from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


# --- Chat Schemas ---
class ChatQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class ChatSourceItem(BaseModel):
    chunk_index: int
    page_number: Optional[int] = None
    content: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[ChatSourceItem] = []


class ChatMessageResponse(BaseModel):
    id: int
    document_id: int
    role: str
    content: str
    sources: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Cross-Document Global Chat Schemas ---
class GlobalChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class GlobalChatSourceItem(BaseModel):
    document_id: int
    document_title: str
    page_number: Optional[int] = None
    content: str


class GlobalChatResponse(BaseModel):
    answer: str
    sources: List[GlobalChatSourceItem] = []


# --- Summarization Schemas ---
class SummarySection(BaseModel):
    title: str
    content: str


class SummaryResponse(BaseModel):
    document_id: int
    executive_summary: str
    key_concepts: List[str] = []
    takeaways: List[str] = []
    sections: Optional[List[SummarySection]] = []


# --- Quiz Schemas ---
class QuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(..., min_length=2, max_length=6)
    answer: str
    explanation: Optional[str] = None


class QuizGenerateRequest(BaseModel):
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: Optional[str] = Field(default="medium", pattern="^(easy|medium|hard)$")


class QuizResponse(BaseModel):
    id: int
    document_id: int
    title: str
    questions: List[QuizQuestion]
    created_at: datetime

    class Config:
        from_attributes = True


class QuizSubmitRequest(BaseModel):
    answers: dict[int, str]


class QuizScoreResult(BaseModel):
    total_questions: int
    correct_count: int
    score_percentage: float
    review: List[dict]


# --- Flashcard Schemas ---
class FlashcardItem(BaseModel):
    front: str
    back: str


class FlashcardGenerateRequest(BaseModel):
    num_cards: int = Field(default=8, ge=3, le=30)


class FlashcardSetResponse(BaseModel):
    id: int
    document_id: int
    title: str
    cards: List[FlashcardItem]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Analytics Stats Schema ---
class AnalyticsStatsResponse(BaseModel):
    total_documents: int
    total_questions_asked: int
    total_quizzes_taken: int
    avg_quiz_score: float
    total_flashcard_decks: int
