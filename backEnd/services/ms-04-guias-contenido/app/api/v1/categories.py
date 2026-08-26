from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.guide_category import GuideCategory
from app.core.dependencies import get_db
from app.schemas.guide import GuideCategoryResponse

router = APIRouter(prefix="/guide-categories", tags=["Categorías de Guías y Trámites"])


@router.get("/", response_model=List[GuideCategoryResponse])
async def list_guide_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Lista las temáticas de orientación cívica (Denuncias, Trámites DNI, Prevención, etc.)."""
    query = (
        select(GuideCategory)
        .where(GuideCategory.is_active == True)
        .order_by(GuideCategory.sort_order.asc())
    )
    result = await db.execute(query)
    return result.scalars().all()
