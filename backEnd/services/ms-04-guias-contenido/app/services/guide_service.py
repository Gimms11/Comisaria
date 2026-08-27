import unicodedata
from datetime import datetime, timezone
import re
from typing import List, Optional
import uuid
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from packages.shared.models.guide import Guide
from packages.shared.models.guide_category import GuideCategory
from packages.shared.models.guide_resource import GuideResource
from packages.shared.schemas.enums import GuideResourceType
from app.schemas.guide import (
    CreateGuideRequest,
    CreateGuideResourceRequest,
    GuideCategoryResponse,
    GuideDetailResponse,
    GuideListItem,
    GuideResourceResponse,
    InteractionCountResponse,
    PublishGuideRequest,
    UpdateGuideRequest,
    is_tiktok_url,
)
from app.services.tiktok_downloader import tiktok_downloader


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


class GuideService:
    @staticmethod
    async def list_guides(
        db: AsyncSession,
        category_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        is_featured: Optional[bool] = None,
        is_published: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> List[GuideListItem]:
        query = (
            select(Guide)
            .options(selectinload(Guide.category))
            .order_by(Guide.sort_order.asc(), desc(Guide.created_at))
            .offset(skip)
            .limit(limit)
        )
        if is_published is not None:
            query = query.where(Guide.is_published == is_published)
        if category_id:
            query = query.where(Guide.category_id == category_id)
        if is_featured is not None:
            query = query.where(Guide.is_featured == is_featured)
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(Guide.title.ilike(pattern), Guide.summary.ilike(pattern))
            )

        result = await db.execute(query)
        guides = result.scalars().all()

        return [
            GuideListItem(
                id=g.id,
                title=g.title,
                slug=g.slug,
                summary=g.summary,
                category_id=g.category_id,
                category_name=g.category.name if g.category else None,
                content_type=g.content_type,
                main_video_url=g.main_video_url,
                thumbnail_url=g.thumbnail_url,
                duration_seconds=g.duration_seconds,
                is_featured=g.is_featured,
                is_published=g.is_published,
                view_count=g.view_count,
                helpful_count=g.helpful_count,
                sort_order=g.sort_order,
                created_at=g.created_at,
            )
            for g in guides
        ]

    @staticmethod
    async def get_guide(
        db: AsyncSession, slug_or_id: str, allow_unpublished: bool = False
    ) -> Optional[GuideDetailResponse]:
        query = select(Guide).options(
            selectinload(Guide.category), selectinload(Guide.resources)
        )

        try:
            guide_uuid = uuid.UUID(slug_or_id)
            query = query.where(Guide.id == guide_uuid)
        except ValueError:
            query = query.where(Guide.slug == slug_or_id)

        if not allow_unpublished:
            query = query.where(Guide.is_published == True)

        result = await db.execute(query)
        guide = result.scalar_one_or_none()
        if not guide:
            return None

        return GuideDetailResponse.model_validate(guide)

    @staticmethod
    async def create_guide(db: AsyncSession, guide_in: CreateGuideRequest) -> Guide:
        if guide_in.category_id:
            cat_query = select(GuideCategory).where(
                GuideCategory.id == guide_in.category_id, GuideCategory.is_active == True
            )
            cat_res = await db.execute(cat_query)
            category = cat_res.scalar_one_or_none()
            if not category:
                raise ValueError("Categoría de guía no válida o inactiva")

        slug = guide_in.slug or slugify(guide_in.title)

        slug_check = await db.execute(select(Guide).where(Guide.slug == slug))
        if slug_check.scalar_one_or_none():
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        video_url = guide_in.main_video_url
        thumbnail_url = guide_in.thumbnail_url
        duration_seconds = guide_in.duration_seconds

        if guide_in.main_video_url and is_tiktok_url(guide_in.main_video_url):
            tiktok_data = await tiktok_downloader.process_tiktok_url(
                guide_in.main_video_url, slug
            )
            video_url = tiktok_data["video_url"]
            if duration_seconds is None and tiktok_data.get("duration"):
                duration_seconds = tiktok_data["duration"]
            if thumbnail_url is None and tiktok_data.get("cover"):
                thumbnail_url = tiktok_data["cover"]

        guide = Guide(
            category_id=guide_in.category_id,
            title=guide_in.title.strip(),
            slug=slug,
            summary=guide_in.summary,
            content_type=guide_in.content_type,
            main_video_url=video_url,
            thumbnail_url=thumbnail_url,
            duration_seconds=duration_seconds,
            transcript=guide_in.transcript,
            is_featured=guide_in.is_featured,
            is_published=guide_in.is_published,
            sort_order=guide_in.sort_order,
        )
        db.add(guide)
        await db.commit()
        await db.refresh(guide)
        return guide

    @staticmethod
    async def update_guide(
        db: AsyncSession, guide_id: uuid.UUID, update_in: UpdateGuideRequest
    ) -> Guide:
        query = select(Guide).where(Guide.id == guide_id)
        result = await db.execute(query)
        guide = result.scalar_one_or_none()
        if not guide:
            raise ValueError("Guía no encontrada")

        if update_in.main_video_url and is_tiktok_url(update_in.main_video_url):
            tiktok_data = await tiktok_downloader.process_tiktok_url(
                update_in.main_video_url, guide.slug
            )
            update_in.main_video_url = tiktok_data["video_url"]
            if update_in.duration_seconds is None and tiktok_data.get("duration"):
                update_in.duration_seconds = tiktok_data["duration"]
            if update_in.thumbnail_url is None and tiktok_data.get("cover"):
                update_in.thumbnail_url = tiktok_data["cover"]

        update_data = update_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(guide, field, value)

        await db.commit()
        await db.refresh(guide)
        return guide

    @staticmethod
    async def publish_guide(
        db: AsyncSession, guide_id: uuid.UUID, is_published: bool
    ) -> Guide:
        query = select(Guide).where(Guide.id == guide_id)
        result = await db.execute(query)
        guide = result.scalar_one_or_none()
        if not guide:
            raise ValueError("Guía no encontrada")

        guide.is_published = is_published
        await db.commit()
        await db.refresh(guide)
        return guide

    @staticmethod
    async def delete_guide(db: AsyncSession, guide_id: uuid.UUID) -> bool:
        query = select(Guide).where(Guide.id == guide_id)
        result = await db.execute(query)
        guide = result.scalar_one_or_none()
        if not guide:
            raise ValueError("Guía no encontrada")

        await db.delete(guide)
        await db.commit()
        return True

    @staticmethod
    async def attach_resource(
        db: AsyncSession,
        guide_id: uuid.UUID,
        title: Optional[str],
        resource_type: GuideResourceType,
        media_url: Optional[str] = None,
        body: Optional[str] = None,
        duration_seconds: Optional[int] = None,
    ) -> GuideResource:
        query = select(Guide).where(Guide.id == guide_id)
        result = await db.execute(query)
        guide = result.scalar_one_or_none()
        if not guide:
            raise ValueError("Guía no encontrada")

        resource = GuideResource(
            guide_id=guide.id,
            title=title.strip() if title else None,
            resource_type=resource_type,
            media_url=media_url,
            body=body,
            duration_seconds=duration_seconds,
        )
        db.add(resource)
        await db.commit()
        await db.refresh(resource)
        return resource

    @staticmethod
    async def track_interaction(
        db: AsyncSession, guide_id: uuid.UUID, event_type: str
    ) -> InteractionCountResponse:
        query = select(Guide).where(Guide.id == guide_id)
        result = await db.execute(query)
        guide = result.scalar_one_or_none()
        if not guide:
            raise ValueError("Guía no encontrada")

        if event_type == "view":
            guide.view_count += 1
        elif event_type == "helpful":
            guide.helpful_count += 1
        else:
            raise ValueError("Tipo de evento no soportado")

        await db.commit()
        return InteractionCountResponse(
            guide_id=guide.id,
            event_type=event_type,
            view_count=guide.view_count,
            helpful_count=guide.helpful_count,
        )
