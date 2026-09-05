from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from packages.shared.schemas.enums import GuideResourceType, OfficerRole
from app.core.dependencies import get_current_officer, get_db, require_roles
from app.schemas.guide import (
    CreateGuideRequest,
    CreateGuideResourceRequest,
    GuideDetailResponse,
    GuideListItem,
    GuideResourceResponse,
    PublishGuideRequest,
    UpdateGuideRequest,
)
from app.services.guide_service import GuideService

router = APIRouter(prefix="/admin/guides", tags=["Gestión Editorial"])


@router.get("", response_model=List[GuideListItem], include_in_schema=False, dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))])
@router.get(
    "/",
    response_model=List[GuideListItem],
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))],
)
async def list_all_guides_for_admin(
    db: Annotated[AsyncSession, Depends(get_db)],
    category_id: Optional[uuid.UUID] = Query(None),
    is_published: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Listado editorial de guías (borradores y publicadas)."""
    return await GuideService.list_guides(
        db,
        category_id=category_id,
        is_published=is_published,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{guide_id}",
    response_model=GuideDetailResponse,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))],
)
async def get_guide_for_admin(
    guide_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    guide = await GuideService.get_guide(db, slug_or_id=str(guide_id), allow_unpublished=True)
    if not guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guía no encontrada")
    return guide


@router.post("", response_model=GuideDetailResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False, dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))])
@router.post(
    "/",
    response_model=GuideDetailResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))],
)

async def create_guide(
    guide_in: CreateGuideRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        guide = await GuideService.create_guide(db, guide_in)
        return await GuideService.get_guide(db, str(guide.id), allow_unpublished=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/{guide_id}",
    response_model=GuideDetailResponse,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))],
)
async def update_guide(
    guide_id: uuid.UUID,
    guide_in: UpdateGuideRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        await GuideService.update_guide(db, guide_id=guide_id, update_in=guide_in)
        return await GuideService.get_guide(db, str(guide_id), allow_unpublished=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch(
    "/{guide_id}/publish",
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))],
)
async def toggle_publish_guide(
    guide_id: uuid.UUID,
    publish_in: PublishGuideRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        guide = await GuideService.publish_guide(
            db, guide_id=guide_id, is_published=publish_in.is_published
        )
        return {"status": "success", "guide_id": str(guide.id), "is_published": guide.is_published}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{guide_id}/resources",
    response_model=GuideResourceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO, OfficerRole.MODERADOR))],
)
async def add_guide_resource(
    guide_id: uuid.UUID,
    resource_in: CreateGuideResourceRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        resource = await GuideService.attach_resource(
            db=db,
            guide_id=guide_id,
            title=resource_in.title,
            resource_type=resource_in.resource_type,
            media_url=resource_in.media_url,
            body=resource_in.body,
            duration_seconds=resource_in.duration_seconds,
        )
        return resource
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/{guide_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(OfficerRole.ADMIN, OfficerRole.COMISARIO))],
)
async def delete_guide(
    guide_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        await GuideService.delete_guide(db, guide_id=guide_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
