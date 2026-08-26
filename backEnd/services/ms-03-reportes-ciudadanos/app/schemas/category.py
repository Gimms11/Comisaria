import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict
from packages.shared.schemas.enums import ReportType


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    icon_name: Optional[str] = None
    applicable_type: ReportType
    is_emergency_default: bool
    sort_order: int

    model_config = ConfigDict(from_attributes=True)
