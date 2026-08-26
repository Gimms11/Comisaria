import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from packages.shared.database import Base
from packages.shared.schemas.enums import ReportStatus


class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    officer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("officers.id", ondelete="SET NULL"),
        nullable=True,
    )
    old_status: Mapped[Optional[ReportStatus]] = mapped_column(
        Enum(ReportStatus, name="report_status", values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    new_status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    report = relationship("Report", back_populates="status_history")
    officer = relationship("Officer", lazy="joined")
