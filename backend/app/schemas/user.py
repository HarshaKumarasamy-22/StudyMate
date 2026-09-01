from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# --- Shared User Properties ---
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


# --- Properties to receive via API on User Creation ---
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


# --- Properties to receive via API on User Login ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --- Properties to return to client (omits password) ---
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- JWT Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
