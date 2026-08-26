import uuid
from typing import Optional
from pydantic import BaseModel
from packages.shared.schemas.enums import MediaType


class MediaUploadResponse(BaseModel):
    id: uuid.UUID
    media_type: MediaType
    storage_path: str
    thumbnail_path: Optional[str] = None
    size_bytes: Optional[int] = None
    status: str = "uploaded"
