from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.share import ShareCountResponse, ShareEventRequest
from app.services.community_service import CommunityService

router = APIRouter(prefix="/community-reports", tags=["Métricas de Difusión Cívica"])


@router.post("/{public_code}/share", response_model=ShareCountResponse)
async def record_report_share(
    public_code: str,
    share_in: ShareEventRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Registra evento anónimo de difusión en redes sociales e incrementa el contador de impacto."""
    try:
        new_count = await CommunityService.record_share(
            db, public_code=public_code, platform=share_in.platform
        )
        return ShareCountResponse(
            public_code=public_code,
            shares_count=new_count,
            status="recorded",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
