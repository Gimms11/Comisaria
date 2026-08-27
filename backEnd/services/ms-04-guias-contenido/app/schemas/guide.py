import re
from datetime import datetime
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator
from packages.shared.schemas.enums import GuideContentType, GuideResourceType


# --- TikTok URL validation ---

TIKTOK_LONG_URL_REGEX = re.compile(
    r"^https?://(www\.)?tiktok\.com/@[\w.]+/video/(\d{15,25})(\?.*)?$"
)

TIKTOK_SHORT_URL_REGEX = re.compile(
    r"^https?://(vm|vt|www)\.tiktok\.com/(t/)?[\w]+/?(\?.*)?$"
)

def is_tiktok_url(url: str) -> bool:
    url = url.strip()
    return bool(TIKTOK_LONG_URL_REGEX.match(url) or TIKTOK_SHORT_URL_REGEX.match(url))



class GuideCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    icon_name: Optional[str] = None
    sort_order: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class GuideResourceResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str] = None
    resource_type: GuideResourceType
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    external_url: Optional[str] = None
    body: Optional[str] = None
    duration_seconds: Optional[int] = None
    sort_order: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuideListItem(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    summary: str
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    content_type: GuideContentType
    main_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    is_featured: bool
    is_published: bool
    view_count: int
    helpful_count: int
    sort_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuideDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    summary: str
    category: Optional[GuideCategoryResponse] = None
    content_type: GuideContentType
    main_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[str] = None
    is_featured: bool
    is_published: bool
    view_count: int
    helpful_count: int
    sort_order: int
    resources: List[GuideResourceResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateGuideRequest(BaseModel):
    category_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    summary: str = Field(..., min_length=1)
    content_type: GuideContentType = GuideContentType.VIDEO
    main_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[str] = None
    is_featured: bool = False
    is_published: bool = False
    sort_order: int = 0

    @field_validator("main_video_url", mode="before")
    @classmethod
    def validate_tiktok_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        # Solo verificamos que sea TikTok para permitir descarga, si no es, asumimos que es otro link de video.
        return v


class UpdateGuideRequest(BaseModel):
    category_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    content_type: Optional[GuideContentType] = None
    main_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    sort_order: Optional[int] = None

    @field_validator("main_video_url", mode="before")
    @classmethod
    def validate_tiktok_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        return v


class CreateGuideResourceRequest(BaseModel):
    title: Optional[str] = None
    resource_type: GuideResourceType
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    external_url: Optional[str] = None
    body: Optional[str] = None
    duration_seconds: Optional[int] = None
    sort_order: int = 0


class PublishGuideRequest(BaseModel):
    is_published: bool


class TrackInteractionRequest(BaseModel):
    event_type: str = Field(..., description="view, helpful")


class InteractionCountResponse(BaseModel):
    guide_id: uuid.UUID
    event_type: str
    view_count: int
    helpful_count: int
