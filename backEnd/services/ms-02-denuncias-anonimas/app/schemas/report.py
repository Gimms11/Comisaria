from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field
from packages.shared.schemas.enums import ReportPriority, ReportStatus, ReportType
from app.schemas.category import CategoryResponse
from app.schemas.media import SignedMediaResponse


class CreateReportRequest(BaseModel):
    category_id: uuid.UUID
    description: str = Field(..., min_length=10, max_length=5000)
    followup_code: Optional[str] = Field(None, min_length=4, max_length=20)
    priority: ReportPriority = ReportPriority.MEDIA
    is_emergency: bool = False
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    address_reference: Optional[str] = None
    location_note: Optional[str] = None


class PublicReportResponse(BaseModel):
    public_code: str
    status: ReportStatus
    created_at: datetime


class ReportStatusResponse(BaseModel):
    public_code: str
    status: ReportStatus
    category_name: str
    description: str
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    history: List[dict] = []


class UpdateReportStatusRequest(BaseModel):
    new_status: ReportStatus
    note: Optional[str] = None


class AddInternalNoteRequest(BaseModel):
    internal_note: str = Field(..., min_length=1, max_length=2000)


class PoliceReportListItem(BaseModel):
    id: uuid.UUID
    public_code: str
    category_name: str
    status: ReportStatus
    priority: ReportPriority
    is_emergency: bool
    description: str
    address_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PoliceReportDetailResponse(BaseModel):
    id: uuid.UUID
    public_code: str
    report_type: ReportType
    category: CategoryResponse
    description: str
    status: ReportStatus
    priority: ReportPriority
    is_emergency: bool
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    address_reference: Optional[str] = None
    location_note: Optional[str] = None
    internal_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    media: List[SignedMediaResponse] = []
    status_history: List[dict] = []

    model_config = ConfigDict(from_attributes=True)
