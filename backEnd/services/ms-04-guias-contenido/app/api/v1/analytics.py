from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.guide import InteractionCountResponse, TrackInteractionRequest
from app.services.guide_service import GuideService

router = APIRouter(prefix="/guides", tags=["Métricas de Visualización"])


@router.post("/{guide_id}/track", response_model=InteractionCountResponse)
async def track_guide_interaction(
    guide_id: uuid.UUID,
    track_in: TrackInteractionRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Registra vistas y utilidades de la guía de forma anónima."""
    try:
        return await GuideService.track_interaction(
            db, guide_id=guide_id, event_type=track_in.event_type
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
