from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class DocumentCreate(DocumentBase):
    pass


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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    total_chunks: int = 0
