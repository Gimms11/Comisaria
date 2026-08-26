import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from packages.shared.schemas.enums import MediaType


class MediaUploadResponse(BaseModel):
    id: uuid.UUID
    media_type: MediaType
    storage_path: str
    thumbnail_path: Optional[str] = None
    size_bytes: Optional[int] = None
    status: str = "uploaded"


class SignedMediaResponse(BaseModel):
    id: uuid.UUID
    media_type: MediaType
    download_url: str
    thumbnail_url: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
