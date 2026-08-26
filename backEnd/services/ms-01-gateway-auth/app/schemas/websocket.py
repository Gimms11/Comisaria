from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class BroadcastAlertPayload(BaseModel):
    event_type: str  # NEW_CRIME_REPORT, NEW_COMMUNITY_REPORT, STATUS_CHANGED
    public_code: str
    priority: str = "media"
    category_name: str
    extra_data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WSEventMessage(BaseModel):
    event: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
