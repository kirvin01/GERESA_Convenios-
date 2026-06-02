# Modelos Pydantic compartidos

from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInDB(BaseModel):
    id: Optional[int] = None
    username: str
    hashed_password: str
    role: str = "user"
    disabled: bool = False
