from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from packages.shared.models.report import Report
from packages.shared.schemas.enums import OfficerRole, ReportPriority, ReportStatus, ReportType
from packages.shared.schemas.state_machine import TransitionOption
from app.core.dependencies import get_current_officer, get_db, require_roles
from app.schemas.community_report import (
    CommunityReportListItem,
    UpdateDerivationStatusRequest,
)
from app.services.community_service import CommunityService
from typing import List as TypingList

router = APIRouter(prefix="/police/community-reports", tags=["Gestión Policial y Serenazgo"])


@router.get("", response_model=List[CommunityReportListItem], include_in_schema=False, dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR))])
@router.get(
    "/",
    response_model=List[CommunityReportListItem],
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR))],
)

async def list_community_reports_for_police(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[ReportStatus] = Query(None),
    priority: Optional[ReportPriority] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """Bandeja de incidencias urbanas para la Comisaría y Serenazgo."""
    return await CommunityService.list_community_reports(db, skip=skip, limit=limit)


@router.patch(
    "/{report_id}/status",
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR))],
)
async def update_report_status_for_police(
    report_id: uuid.UUID,
    update_in: UpdateDerivationStatusRequest,
    current_officer: Annotated[Officer, Depends(get_current_officer)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Actualiza estado de incidencia vecinal (ej. 'derivado' a Serenazgo/Municipio, 'en_atencion', 'resuelto')
    con nota de constancia pública para los vecinos.
    """
    try:
        report = await CommunityService.update_status(
            db=db,
            report_id=report_id,
            officer=current_officer,
            new_status=update_in.new_status,
            note=update_in.note,
            destination_entity=update_in.destination_entity,
            document_number=update_in.document_number,
        )
        return {
            "status": "updated",
            "report_id": str(report.id),
            "public_code": report.public_code,
            "new_status": report.status.value,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

@router.get(
    "/{report_id}/transitions",
    response_model=List[TransitionOption],
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR))],
)
async def get_available_transitions(
    report_id: uuid.UUID,
    current_officer: Annotated[Officer, Depends(get_current_officer)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        return await CommunityService.get_available_transitions(db, report_id, current_officer)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post(
    "/{report_id}/transition",
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR, OfficerRole.MODERADOR))],
)
async def execute_transition(
    report_id: uuid.UUID,
    current_officer: Annotated[Officer, Depends(get_current_officer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    target_status: ReportStatus = Form(...),
    note: str = Form(...),
    destination_entity: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None),
    evidence_files: TypingList[UploadFile] = File(default=[]),
):
    evidence_bytes = []
    for f in evidence_files:
        content = await f.read()
        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Archivo supera 20MB")
        evidence_bytes.append(content)
    
    try:
        report = await CommunityService.update_status(
            db=db,
            report_id=report_id,
            officer=current_officer,
            new_status=target_status,
            note=note,
            evidence_files=evidence_bytes,
            destination_entity=destination_entity,
            document_number=document_number,
        )
        return {
            "status": "updated",
            "report_id": str(report.id),
            "public_code": report.public_code,
            "new_status": report.status.value,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
