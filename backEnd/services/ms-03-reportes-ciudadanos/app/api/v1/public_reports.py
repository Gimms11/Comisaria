from pathlib import Path
from typing import Annotated, List
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.community_report import (
    CommunityReportDetailResponse,
    CommunityReportListItem,
    CreateCommunityReportRequest,
    PublicCommunityReportResponse,
)
from packages.shared.schemas.media_validator import (
    MediaUploadPayload,
    PayloadTooLargeError,
    InvalidMediaFormatError,
)
from app.schemas.media import MediaUploadResponse
from app.services.community_service import CommunityService


router = APIRouter(tags=["Reportes Ciudadanos y Comunitarios"])

templates_dir = Path(__file__).resolve().parent.parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=True)


@router.post("/community-reports", response_model=PublicCommunityReportResponse, status_code=status.HTTP_201_CREATED)
async def create_community_report(
    report_in: CreateCommunityReportRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Registra una incidencia urbana o reporte comunitario."""
    try:
        _, public_resp = await CommunityService.create_community_report(db, report_in)
        return public_resp
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/community-reports", response_model=List[CommunityReportListItem])
async def list_community_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Listado público de incidencias vecinales en el distrito."""
    return await CommunityService.list_community_reports(db, skip=skip, limit=limit)


@router.get("/community-reports/{public_code}", response_model=CommunityReportDetailResponse)
async def get_community_report_detail(
    public_code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Detalle público de una incidencia vecinal."""
    report = await CommunityService.get_community_report(db, public_code=public_code)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado")
    return report


@router.post(
    "/community-reports/{public_code}/media",
    response_model=MediaUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_community_media(
    public_code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    contents = await file.read()

    # Validación Pydantic con límites de payload y comprobación de tipo real
    try:
        validated_payload = MediaUploadPayload.validate_file(
            filename=file.filename or "reporte_comunitario.jpg",
            content_type=file.content_type or "application/octet-stream",
            file_bytes=contents,
            max_size_bytes=20 * 1024 * 1024,
        )

    except PayloadTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(exc),
        )
    except (InvalidMediaFormatError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    try:
        media = await CommunityService.attach_media(
            db,
            public_code=public_code,
            file_bytes=validated_payload.file_bytes,
        )
        return MediaUploadResponse(
            id=media.id,
            media_type=media.media_type,
            storage_path=media.storage_path,
            thumbnail_path=media.thumbnail_path,
            size_bytes=media.size_bytes,
            status="uploaded",
        )
    except ValueError as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error procesando la imagen: {str(e)}",
        )



preview_router = APIRouter(tags=["Social Preview"])


@preview_router.get("/community/p/{public_code}", response_class=HTMLResponse)
@router.get("/community/p/{public_code}", response_class=HTMLResponse)
async def open_graph_preview_page(
    public_code: str,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Renderiza vista web con Meta Tags OpenGraph para previsualizaciones en WhatsApp y redes."""
    report = await CommunityService.get_community_report(db, public_code=public_code)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte no encontrado")

    image_url = report.media_urls[0] if report.media_urls else ""
    template = jinja_env.get_template("og_preview.html")
    html_content = template.render(
        title=f"Reporte Ciudadano: {report.category.name}",
        description=report.description,
        category_name=report.category.name,
        public_code=report.public_code,
        status=report.status.value.upper(),
        image_url=image_url,
        page_url=str(request.url),
    )
    return HTMLResponse(content=html_content)
