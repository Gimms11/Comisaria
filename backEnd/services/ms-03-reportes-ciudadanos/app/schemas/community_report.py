from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from packages.shared.schemas.enums import ReportPriority, ReportStatus
from app.schemas.category import CategoryResponse


class CreateCommunityReportRequest(BaseModel):
    category_id: uuid.UUID
    description: str = Field(..., min_length=10, max_length=5000)
    priority: ReportPriority = ReportPriority.MEDIA
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    address_reference: Optional[str] = None
    location_note: Optional[str] = None


class PublicCommunityReportResponse(BaseModel):
    public_code: str
    status: ReportStatus
    created_at: datetime


class CommunityReportListItem(BaseModel):
    id: uuid.UUID
    public_code: str
    category_id: Optional[uuid.UUID] = None
    category_name: str
    category_slug: Optional[str] = None
    status: ReportStatus
    priority: ReportPriority
    description: str
    address_reference: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    shares_count: int
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommunityReportDetailResponse(BaseModel):
    id: uuid.UUID
    public_code: str
    category: CategoryResponse
    status: ReportStatus
    priority: ReportPriority
    description: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    address_reference: Optional[str] = None
    location_note: Optional[str] = None
    shares_count: int
    media_urls: List[str] = []
    status_history: List[dict] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UpdateDerivationStatusRequest(BaseModel):
    new_status: ReportStatus  # derivado, en_atencion, resuelto
    note: str = Field(..., min_length=3, max_length=1000, description="Constancia pública de la derivación o resolución")
    destination_entity: Optional[str] = None
    document_number: Optional[str] = None
