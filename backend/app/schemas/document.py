from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    tags: Optional[List[str]] = Field(default_factory=list)


class DocumentCreate(DocumentBase):
    pass


class DocumentTagUpdate(BaseModel):
    tags: List[str] = Field(default_factory=list)


class DocumentChunkResponse(BaseModel):
    id: int
    chunk_index: int
    page_number: Optional[int] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    filename: str
    file_size: int
    num_pages: int
    tags: Optional[List[str]] = []
    summary: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    total_chunks: int = 0
