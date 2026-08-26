from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from packages.shared.models.report import Report
from packages.shared.schemas.enums import OfficerRole, ReportPriority, ReportStatus, ReportType
from app.core.dependencies import get_current_officer, get_db, require_roles
from app.schemas.community_report import (
    CommunityReportListItem,
    UpdateDerivationStatusRequest,
)
from app.services.community_service import CommunityService

router = APIRouter(prefix="/police/community-reports", tags=["Gestión Policial y Serenazgo"])


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
    limit: int = Query(50, ge=1, le=100),
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
        )
        return {
            "status": "updated",
            "report_id": str(report.id),
            "public_code": report.public_code,
            "new_status": report.status.value,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
