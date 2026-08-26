from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from packages.shared.models.report import Report
from packages.shared.schemas.enums import OfficerRole, ReportPriority, ReportStatus
from app.core.dependencies import get_current_officer, get_db, require_roles
from app.schemas.report import (
    AddInternalNoteRequest,
    PoliceReportDetailResponse,
    PoliceReportListItem,
    UpdateReportStatusRequest,
)
from app.services.report_service import ReportService

router = APIRouter(prefix="/police/reports", tags=["Gestión Policial de Denuncias"])


@router.get(
    "/",
    response_model=List[PoliceReportListItem],
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR))],
)
async def list_reports_for_police(
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Optional[ReportStatus] = Query(None, description="Filtrar por estado"),
    priority: Optional[ReportPriority] = Query(None, description="Filtrar por prioridad"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Bandeja de denuncias policiales con filtros de estado y prioridad."""
    return await ReportService.list_police_reports(
        db, status_filter=status, priority_filter=priority, skip=skip, limit=limit
    )


@router.get(
    "/{report_id}",
    response_model=PoliceReportDetailResponse,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR))],
)
async def get_report_detail_for_police(
    report_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Obtiene el detalle completo de la denuncia con URLs firmadas temporales para evidencias."""
    detail = await ReportService.get_police_report_detail(db, report_id=report_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Denuncia no encontrada",
        )
    return detail


@router.patch(
    "/{report_id}/status",
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR))],
)
async def update_report_status_for_police(
    report_id: uuid.UUID,
    status_in: UpdateReportStatusRequest,
    current_officer: Annotated[Officer, Depends(get_current_officer)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Actualiza el estado de una denuncia y registra la acción en el historial de auditoría."""
    try:
        report = await ReportService.update_status(
            db=db,
            report_id=report_id,
            officer=current_officer,
            new_status=status_in.new_status,
            note=status_in.note,
        )
        return {
            "status": "updated",
            "report_id": str(report.id),
            "public_code": report.public_code,
            "new_status": report.status.value,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{report_id}/notes",
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.OPERADOR))],
)
async def add_internal_police_note(
    report_id: uuid.UUID,
    note_in: AddInternalNoteRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Agrega una nota interna visible exclusivamente para oficiales policiales."""
    query = select(Report).where(Report.id == report_id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Denuncia no encontrada",
        )

    report.internal_note = note_in.internal_note.strip()
    await db.commit()
    return {"message": "Nota interna guardada exitosamente"}
