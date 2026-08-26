from typing import Annotated, List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.report_category import ReportCategory
from packages.shared.schemas.enums import ReportType
from app.core.dependencies import get_db
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categorías de Denuncias"])


@router.get("/", response_model=List[CategoryResponse])
async def list_crime_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Lista las categorías de delitos disponibles para denuncias anónimas."""
    query = (
        select(ReportCategory)
        .where(
            ReportCategory.applicable_type == ReportType.DENUNCIA_ANONIMA,
            ReportCategory.is_active == True,
        )
        .order_by(ReportCategory.sort_order.asc())
    )
    result = await db.execute(query)
    return result.scalars().all()
