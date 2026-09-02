from datetime import datetime, timezone
import random
from typing import List, Optional, Tuple
import uuid
from sqlalchemy import desc, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from packages.shared.clients.broadcast_client import BroadcastClient
from packages.shared.models.officer import Officer
from packages.shared.models.report import Report
from packages.shared.models.report_category import ReportCategory
from packages.shared.models.report_media import ReportMedia
from packages.shared.models.share_event import ReportShareEvent
from packages.shared.models.status_history import ReportStatusHistory
from packages.shared.schemas.enums import MediaType, ReportPriority, ReportStatus, ReportType
from app.core.config import settings
from app.schemas.community_report import (
    CommunityReportDetailResponse,
    CommunityReportListItem,
    CreateCommunityReportRequest,
    PublicCommunityReportResponse,
)
from app.services.civic_sanitizer import civic_sanitizer
from app.services.civic_storage import civic_storage
from packages.shared.state_machine import CommunityStateMachine
from packages.shared.schemas.state_machine import TransitionOption
broadcast_client = BroadcastClient(
    ms01_url=settings.MS01_INTERNAL_URL,
    internal_service_key=settings.INTERNAL_SERVICE_KEY,
)


class CommunityService:
    """Servicio para gestión de incidencias vecinales, métricas de difusión y derivaciones."""

    @staticmethod
    async def generate_public_code(db: AsyncSession) -> str:
        year = datetime.now(timezone.utc).year
        try:
            result = await db.execute(text("SELECT nextval('seq_reports_public_code')"))
            seq_val = result.scalar()
            return f"LT-{year}-{seq_val:06d}"
        except Exception:
            rand_num = random.randint(100000, 999999)
            return f"LT-{year}-{rand_num}"

    @staticmethod
    async def create_community_report(
        db: AsyncSession, report_in: CreateCommunityReportRequest
    ) -> Tuple[Report, PublicCommunityReportResponse]:
        cat_query = select(ReportCategory).where(
            ReportCategory.id == report_in.category_id,
            ReportCategory.is_active == True,
            ReportCategory.applicable_type == ReportType.REPORTE_COMUNITARIO,
        )
        cat_res = await db.execute(cat_query)
        category = cat_res.scalar_one_or_none()
        if not category:
            raise ValueError("Categoría comunitaria no válida o inactiva")

        public_code = await CommunityService.generate_public_code(db)

        report = Report(
            public_code=public_code,
            report_type=ReportType.REPORTE_COMUNITARIO,
            category_id=category.id,
            description=report_in.description.strip(),
            status=ReportStatus.PENDIENTE,
            priority=report_in.priority,
            latitude=report_in.latitude,
            longitude=report_in.longitude,
            address_reference=report_in.address_reference,
            location_note=report_in.location_note,
            shares_count=0,
            source="mobile_app",
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        try:
            await broadcast_client.emit_alert(
                event_type="NEW_COMMUNITY_REPORT",
                public_code=report.public_code,
                priority=report.priority.value,
                category_name=category.name,
                extra_data={
                    "report_id": str(report.id),
                    "address": report.address_reference,
                    "description": report.description,
                },
            )
        except Exception:
            pass

        return report, PublicCommunityReportResponse(
            public_code=report.public_code,
            status=report.status,
            created_at=report.created_at,
        )

    @staticmethod
    async def attach_media(
        db: AsyncSession, public_code: str, file_bytes: bytes
    ) -> ReportMedia:
        query = select(Report).where(Report.public_code == public_code.strip())
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Reporte comunitario no encontrado")

        now = datetime.now(timezone.utc)
        media_uuid = uuid.uuid4()

        clean_bytes, thumb_bytes, mime_type, size_bytes = civic_sanitizer.sanitize_image(file_bytes)

        main_key = f"urbanos/{now.year}/{now.month:02d}/{media_uuid}.jpg"
        thumb_key = f"urbanos/{now.year}/{now.month:02d}/{media_uuid}_thumb.jpg"

        await civic_storage.upload_bytes(clean_bytes, main_key, mime_type)
        await civic_storage.upload_bytes(thumb_bytes, thumb_key, mime_type)

        media = ReportMedia(
            id=media_uuid,
            report_id=report.id,
            media_type=MediaType.FOTO,
            storage_path=main_key,
            thumbnail_path=thumb_key,
            mime_type=mime_type,
            size_bytes=size_bytes,
        )
        db.add(media)
        await db.commit()
        await db.refresh(media)
        return media

    @staticmethod
    async def list_community_reports(
        db: AsyncSession, skip: int = 0, limit: int = 50
    ) -> List[CommunityReportListItem]:
        query = (
            select(Report)
            .where(Report.report_type == ReportType.REPORTE_COMUNITARIO)
            .options(selectinload(Report.category), selectinload(Report.media))
            .order_by(desc(Report.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        reports = result.scalars().all()

        items = []
        for r in reports:
            image_url = None
            if r.media:
                thumb = r.media[0].thumbnail_path or r.media[0].storage_path
                image_url = await civic_storage.generate_url(thumb)

            items.append(
                CommunityReportListItem(
                    id=r.id,
                    public_code=r.public_code,
                    category_id=r.category.id if r.category else None,
                    category_name=r.category.name if r.category else "Reporte Vecinal",
                    category_slug=r.category.slug if r.category else None,
                    status=r.status,
                    priority=r.priority,
                    description=r.description,
                    address_reference=r.address_reference,
                    latitude=r.latitude,
                    longitude=r.longitude,
                    shares_count=r.shares_count,
                    image_url=image_url,
                    created_at=r.created_at,
                )
            )
        return items

    @staticmethod
    async def get_community_report(
        db: AsyncSession, public_code: str
    ) -> Optional[CommunityReportDetailResponse]:
        query = (
            select(Report)
            .where(Report.public_code == public_code.strip())
            .options(
                selectinload(Report.category),
                selectinload(Report.media),
                selectinload(Report.status_history),
            )
        )
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            return None

        media_urls = [await civic_storage.generate_url(m.storage_path) for m in report.media]
        history_items = [
            {
                "status": h.new_status.value,
                "note": h.note,
                "created_at": h.created_at.isoformat(),
            }
            for h in report.status_history
        ]

        return CommunityReportDetailResponse(
            id=report.id,
            public_code=report.public_code,
            category=report.category,
            status=report.status,
            priority=report.priority,
            description=report.description,
            latitude=report.latitude,
            longitude=report.longitude,
            address_reference=report.address_reference,
            location_note=report.location_note,
            shares_count=report.shares_count,
            media_urls=media_urls,
            status_history=history_items,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )

    @staticmethod
    async def record_share(db: AsyncSession, public_code: str, platform: str) -> int:
        query = select(Report).where(Report.public_code == public_code.strip())
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Reporte no encontrado")

        report.shares_count += 1
        share_event = ReportShareEvent(report_id=report.id, platform=platform.lower().strip())
        db.add(share_event)
        await db.commit()
        return report.shares_count

    @staticmethod
    async def update_status(
        db: AsyncSession,
        report_id: uuid.UUID,
        officer: Officer,
        new_status: ReportStatus,
        note: str,
        evidence_files: list = None,
        destination_entity: str = None,
        document_number: str = None,
    ) -> Report:
        query = select(Report).where(Report.id == report_id)
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Reporte no encontrado")

        media_query = select(ReportMedia).where(ReportMedia.report_id == report.id)
        media_result = await db.execute(media_query)
        existing_media_count = len(media_result.scalars().all())
        total_evidence = existing_media_count + len(evidence_files or [])

        CommunityStateMachine.validate_transition(
            current_status=report.status,
            target_status=new_status,
            officer_role=officer.role,
            note=note or '',
            evidence_count=total_evidence,
            destination_entity=destination_entity,
            document_number=document_number,
        )

        old_status = report.status
        report.status = new_status

        if evidence_files:
            for file_bytes in evidence_files:
                await CommunityService.attach_media(db, report.public_code, file_bytes)

        history = ReportStatusHistory(
            report_id=report.id,
            officer_id=officer.id,
            old_status=old_status,
            new_status=new_status,
            note=note,
        )
        db.add(history)
        await db.commit()
        await db.refresh(report)

        try:
            await broadcast_client.emit_alert(
                event_type="STATUS_CHANGED",
                public_code=report.public_code,
                priority=report.priority.value,
                category_name="Reporte Comunitario",
                extra_data={
                    "report_id": str(report.id),
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                },
            )
        except Exception:
            pass

        return report

    @staticmethod
    async def get_available_transitions(
        db: AsyncSession, report_id: uuid.UUID, officer: Officer
    ) -> list:
        query = select(Report).where(Report.id == report_id)
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Reporte no encontrado")
        return CommunityStateMachine.get_available_transitions(report.status, officer.role)
