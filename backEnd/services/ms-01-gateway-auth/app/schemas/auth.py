import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from packages.shared.schemas.enums import OfficerRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class WSTicketResponse(BaseModel):
    ticket: str
    expires_in: int = 60


class OfficerProfileResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: OfficerRole
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
