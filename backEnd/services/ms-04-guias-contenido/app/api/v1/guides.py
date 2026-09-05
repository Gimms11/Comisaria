from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.guide import GuideDetailResponse, GuideListItem
from app.services.guide_service import GuideService

router = APIRouter(prefix="/guides", tags=["Guías Ciudadanas y Trámites"])


@router.get("", response_model=List[GuideListItem], include_in_schema=False)
@router.get("/", response_model=List[GuideListItem])

async def list_published_guides(
    db: Annotated[AsyncSession, Depends(get_db)],
    category_id: Optional[uuid.UUID] = Query(None, description="Filtrar por categoría"),
    search: Optional[str] = Query(None, description="Búsqueda por texto"),
    is_featured: Optional[bool] = Query(None, description="Filtrar guías destacadas"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
):
    """Feed de guías y micro-videos educativos publicados."""
    return await GuideService.list_guides(
        db,
        category_id=category_id,
        search=search,
        is_featured=is_featured,
        is_published=True,
        skip=skip,
        limit=limit,
    )


@router.get("/{slug_or_id}", response_model=GuideDetailResponse)
async def get_guide_detail(
    slug_or_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Obtiene el detalle completo de la guía, pasos interactivos y recursos multimedia."""
    guide = await GuideService.get_guide(db, slug_or_id=slug_or_id, allow_unpublished=False)
    if not guide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guía no encontrada",
        )
    return guide
