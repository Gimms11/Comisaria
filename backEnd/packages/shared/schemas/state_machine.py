from typing import Optional, List
from pydantic import BaseModel
from packages.shared.schemas.enums import ReportStatus


class TransitionOption(BaseModel):
    target_status: ReportStatus
    label: str
    color: str          # tailwind color name: emerald, red, purple, sky, amber, slate
    icon: str           # lucide icon name: check-circle, x-circle, send, shield, archive, eye, rotate-ccw
    requires_evidence: bool
    requires_destination: bool
    min_note_length: int


class TransitionRequest(BaseModel):
    target_status: ReportStatus
    note: str
    destination_entity: Optional[str] = None
    document_number: Optional[str] = None
