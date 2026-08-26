from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr
from packages.shared.schemas.enums import OfficerRole


class OfficerCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: OfficerRole = OfficerRole.OPERADOR


class OfficerUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[OfficerRole] = None
    is_active: Optional[bool] = None


class OfficerChangePassword(BaseModel):
    current_password: str
    new_password: str


class OfficerResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: OfficerRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
