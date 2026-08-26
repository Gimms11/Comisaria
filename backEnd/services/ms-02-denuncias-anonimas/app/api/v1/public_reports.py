from typing import Annotated, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.schemas.enums import MediaType
from app.core.dependencies import get_db
from app.schemas.media import MediaUploadResponse
from app.schemas.report import (
    CreateReportRequest,
    PublicReportResponse,
    ReportStatusResponse,
)
from app.services.report_service import ReportService

router = APIRouter(tags=["Denuncias Anónimas (Ciudadano)"])


@router.post("/reports", response_model=PublicReportResponse, status_code=status.HTTP_201_CREATED)
async def create_anonymous_report(
    report_in: CreateReportRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Ingesta anónima de una denuncia de delito.
    Retorna exclusivamente el código público de seguimiento (cero UUIDs internos expuestos).
    """
    try:
        _, public_resp = await ReportService.create_report(db, report_in)
        return public_resp
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/reports/{public_code}/status", response_model=ReportStatusResponse)
async def get_report_status(
    public_code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    followup_code: Optional[str] = Query(None, description="Código secreto de 6 dígitos opcional para desbloquear detalles"),
):
    """
    Consulta ciudadana de estado mediante el código público.
    Si se provee el PIN secreto, se valida mediante HMAC y se desbloquea el detalle completo.
    """
    report_status = await ReportService.get_public_status(
        db, public_code=public_code, followup_code=followup_code
    )
    if not report_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de denuncia no encontrado",
        )
    return report_status


@router.post(
    "/reports/{public_code}/media",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_report_evidence(
    public_code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    """
    Sube evidencia multimedia para una denuncia anónima.
    Despoja 100% de metadatos EXIF / GPS antes de almacenar en el bucket privado.
    """
    # Validar tamaño y tipo
    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:  # Máx 25 MB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo supera el límite de 25MB",
        )

    try:
        media_record = await ReportService.attach_media(
            db=db,
            public_code=public_code,
            file_bytes=contents,
            original_filename=file.filename or "evidence.jpg",
            media_type=MediaType.FOTO,
        )
        return MediaUploadResponse(
            id=media_record.id,
            media_type=media_record.media_type,
            storage_path=media_record.storage_path,
            thumbnail_path=media_record.thumbnail_path,
            size_bytes=media_record.size_bytes,
            status="uploaded",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error procesando la imagen: {str(e)}",
        )
