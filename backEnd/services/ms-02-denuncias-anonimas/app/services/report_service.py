from datetime import datetime, timezone
import random
from typing import List, Optional, Tuple
import uuid
from sqlalchemy import desc, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from packages.shared.clients.broadcast_client import BroadcastClient
from packages.shared.models.officer import Officer
from packages.shared.models.report import Report
from packages.shared.models.report_category import ReportCategory
from packages.shared.models.report_media import ReportMedia
from packages.shared.models.status_history import ReportStatusHistory
from packages.shared.schemas.enums import MediaType, ReportPriority, ReportStatus, ReportType
from packages.shared.security import hash_followup_code, verify_followup_code
from packages.shared.state_machine import CrimeStateMachine
from packages.shared.schemas.state_machine import TransitionOption
from app.core.config import settings
from app.schemas.media import SignedMediaResponse
from app.schemas.report import (
    CreateReportRequest,
    PoliceReportDetailResponse,
    PoliceReportListItem,
    PublicReportResponse,
    ReportStatusResponse,
)
from app.services.media_sanitizer import media_sanitizer
from app.services.storage_client import storage_client

broadcast_client = BroadcastClient(
    ms01_url=settings.MS01_INTERNAL_URL,
    internal_service_key=settings.INTERNAL_SERVICE_KEY,
)


class ReportService:
    """Lógica de negocio para denuncias anónimas y seguimiento ciudadano."""

    @staticmethod
    async def generate_public_code(db: AsyncSession) -> str:
        """Genera el código secuencial anual LT-YYYY-XXXXXX."""
        year = datetime.now(timezone.utc).year
        try:
            result = await db.execute(text("SELECT nextval('seq_reports_public_code')"))
            seq_val = result.scalar()
            return f"LT-{year}-{seq_val:06d}"
        except Exception:
            # Fallback en caso de bases de datos de test sin secuencias
            rand_num = random.randint(100000, 999999)
            return f"LT-{year}-{rand_num}"

    @staticmethod
    async def create_report(
        db: AsyncSession, report_in: CreateReportRequest
    ) -> Tuple[Report, PublicReportResponse]:
        # 1. Validar categoría
        cat_query = select(ReportCategory).where(
            ReportCategory.id == report_in.category_id,
            ReportCategory.is_active == True,
            ReportCategory.applicable_type == ReportType.DENUNCIA_ANONIMA,
        )
        cat_res = await db.execute(cat_query)
        category = cat_res.scalar_one_or_none()
        if not category:
            raise ValueError("Categoría de delito no válida o inactiva")

        # 2. Generar public_code y hash de PIN de seguimiento
        public_code = await ReportService.generate_public_code(db)
        followup_hash = None
        if report_in.followup_code:
            followup_hash = hash_followup_code(
                report_in.followup_code, settings.FOLLOWUP_HMAC_KEY
            )

        # 3. Crear registro
        report = Report(
            public_code=public_code,
            followup_code_hash=followup_hash,
            report_type=ReportType.DENUNCIA_ANONIMA,
            category_id=category.id,
            description=report_in.description.strip(),
            status=ReportStatus.PENDIENTE,
            priority=report_in.priority,
            is_emergency=report_in.is_emergency or category.is_emergency_default,
            latitude=report_in.latitude,
            longitude=report_in.longitude,
            address_reference=report_in.address_reference,
            location_note=report_in.location_note,
            source="mobile_app",
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        # 4. Notificar a MS-01 en background
        try:
            await broadcast_client.emit_alert(
                event_type="NEW_CRIME_REPORT",
                public_code=report.public_code,
                priority=report.priority.value,
                category_name=category.name,
                extra_data={
                    "report_id": str(report.id),
                    "is_emergency": report.is_emergency,
                    "address": report.address_reference,
                    "description": report.description,
                },
            )
        except Exception:
            pass

        public_response = PublicReportResponse(
            public_code=report.public_code,
            status=report.status,
            created_at=report.created_at,
        )
        return report, public_response

    @staticmethod
    async def get_public_status(
        db: AsyncSession, public_code: str, followup_code: Optional[str] = None
    ) -> Optional[ReportStatusResponse]:
        query = (
            select(Report)
            .where(Report.public_code == public_code.strip())
            .options(selectinload(Report.category), selectinload(Report.status_history))
        )
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            return None

        # Si el usuario proporciona PIN, verificarlo
        is_verified = False
        if followup_code and report.followup_code_hash:
            is_verified = verify_followup_code(
                followup_code, report.followup_code_hash, settings.FOLLOWUP_HMAC_KEY
            )

        history_items = [
            {
                "status": h.new_status.value,
                "note": h.note if is_verified else None,
                "created_at": h.created_at.isoformat(),
            }
            for h in report.status_history
        ]

        return ReportStatusResponse(
            public_code=report.public_code,
            status=report.status,
            category_name=report.category.name,
            description=report.description if is_verified else "Descripción protegida con PIN",
            is_verified=is_verified,
            created_at=report.created_at,
            updated_at=report.updated_at,
            history=history_items,
        )

    @staticmethod
    async def attach_media(
        db: AsyncSession,
        public_code: str,
        file_bytes: bytes,
        original_filename: str,
        media_type: MediaType = MediaType.FOTO,
    ) -> ReportMedia:
        query = select(Report).where(Report.public_code == public_code.strip())
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Denuncia no encontrada")

        now = datetime.now(timezone.utc)
        media_uuid = uuid.uuid4()

        # 1. Sanitizar imagen (despojar EXIF / GPS)
        clean_bytes, thumb_bytes, mime_type, size_bytes = media_sanitizer.sanitize_image(file_bytes)

        # 2. Subir a storage privado
        main_key = f"evidencias/{now.year}/{now.month:02d}/{media_uuid}.jpg"
        thumb_key = f"evidencias/{now.year}/{now.month:02d}/{media_uuid}_thumb.jpg"

        await storage_client.upload_bytes(clean_bytes, main_key, mime_type)
        await storage_client.upload_bytes(thumb_bytes, thumb_key, mime_type)

        # 3. Guardar registro en BD
        media_record = ReportMedia(
            id=media_uuid,
            report_id=report.id,
            media_type=media_type,
            storage_path=main_key,
            thumbnail_path=thumb_key,
            mime_type=mime_type,
            size_bytes=size_bytes,
        )
        db.add(media_record)
        await db.commit()
        await db.refresh(media_record)
        return media_record

    @staticmethod
    async def list_police_reports(
        db: AsyncSession,
        status_filter: Optional[ReportStatus] = None,
        priority_filter: Optional[ReportPriority] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[PoliceReportListItem]:
        query = (
            select(Report)
            .where(Report.report_type == ReportType.DENUNCIA_ANONIMA)
            .options(selectinload(Report.category))
            .order_by(desc(Report.created_at))
            .offset(skip)
            .limit(limit)
        )
        if status_filter:
            query = query.where(Report.status == status_filter)
        if priority_filter:
            query = query.where(Report.priority == priority_filter)

        result = await db.execute(query)
        reports = result.scalars().all()

        return [
            PoliceReportListItem(
                id=r.id,
                public_code=r.public_code,
                category_name=r.category.name,
                status=r.status,
                priority=r.priority,
                is_emergency=r.is_emergency,
                description=r.description,
                address_reference=r.address_reference,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in reports
        ]

    @staticmethod
    async def get_police_report_detail(
        db: AsyncSession, report_id: uuid.UUID
    ) -> Optional[PoliceReportDetailResponse]:
        query = (
            select(Report)
            .where(Report.id == report_id)
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

        # Generar URLs firmadas temporales para evidencias
        signed_media = []
        for m in report.media:
            download_url = await storage_client.generate_signed_url(m.storage_path)
            thumb_url = None
            if m.thumbnail_path:
                thumb_url = await storage_client.generate_signed_url(m.thumbnail_path)

            signed_media.append(
                SignedMediaResponse(
                    id=m.id,
                    media_type=m.media_type,
                    download_url=download_url,
                    thumbnail_url=thumb_url,
                    mime_type=m.mime_type,
                    size_bytes=m.size_bytes,
                    created_at=m.created_at,
                )
            )

        history_items = [
            {
                "old_status": h.old_status.value if h.old_status else None,
                "new_status": h.new_status.value,
                "note": h.note,
                "created_at": h.created_at.isoformat(),
            }
            for h in report.status_history
        ]

        return PoliceReportDetailResponse(
            id=report.id,
            public_code=report.public_code,
            report_type=report.report_type,
            category=report.category,
            description=report.description,
            status=report.status,
            priority=report.priority,
            is_emergency=report.is_emergency,
            latitude=report.latitude,
            longitude=report.longitude,
            address_reference=report.address_reference,
            location_note=report.location_note,
            internal_note=report.internal_note,
            created_at=report.created_at,
            updated_at=report.updated_at,
            media=signed_media,
            status_history=history_items,
        )

    @staticmethod
    async def get_available_transitions(
        db: AsyncSession, report_id: uuid.UUID, officer: Officer
    ) -> List[TransitionOption]:
        query = select(Report).where(Report.id == report_id)
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Denuncia no encontrada")
        return CrimeStateMachine.get_available_transitions(report.status, officer.role)

    @staticmethod
    async def update_status(
        db: AsyncSession,
        report_id: uuid.UUID,
        officer: Officer,
        new_status: ReportStatus,
        note: Optional[str] = None,
        evidence_files: Optional[List[bytes]] = None,
        destination_entity: Optional[str] = None,
        document_number: Optional[str] = None,
    ) -> Report:
        query = select(Report).where(Report.id == report_id)
        result = await db.execute(query)
        report = result.scalar_one_or_none()
        if not report:
            raise ValueError("Denuncia no encontrada")

        ev_query = select(func.count(ReportMedia.id)).where(ReportMedia.report_id == report_id)
        ev_res = await db.execute(ev_query)
        existing_evidence = ev_res.scalar_one()
        total_evidence = existing_evidence + len(evidence_files or [])

        CrimeStateMachine.validate_transition(
            current_status=report.status,
            target_status=new_status,
            officer_role=officer.role,
            note=note or "",
            evidence_count=total_evidence,
            destination_entity=destination_entity,
            document_number=document_number,
        )

        if evidence_files:
            for file_bytes in evidence_files:
                await ReportService.attach_media(
                    db=db,
                    public_code=report.public_code,
                    file_bytes=file_bytes,
                    original_filename="evidencia.jpg",
                    media_type=MediaType.FOTO
                )

        old_status = report.status
        report.status = new_status

        # Registrar en historial
        history_entry = ReportStatusHistory(
            report_id=report.id,
            officer_id=officer.id,
            old_status=old_status,
            new_status=new_status,
            note=note,
        )
        db.add(history_entry)
        await db.commit()
        await db.refresh(report)

        # Notificar a MS-01 cambio de estado
        try:
            await broadcast_client.emit_alert(
                event_type="STATUS_CHANGED",
                public_code=report.public_code,
                priority=report.priority.value,
                category_name="Denuncia",
                extra_data={
                    "report_id": str(report.id),
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                },
            )
        except Exception:
            pass

        return report
