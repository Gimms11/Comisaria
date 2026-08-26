import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from packages.shared.database import Base
from packages.shared.schemas.enums import ReportPriority, ReportStatus, ReportType


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    public_code: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    followup_code_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="report_type", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("report_categories.id"),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ReportStatus.PENDIENTE,
        index=True,
    )
    priority: Mapped[ReportPriority] = mapped_column(
        Enum(ReportPriority, name="report_priority", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ReportPriority.MEDIA,
    )
    is_emergency: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(9, 6), nullable=True)
    address_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    shares_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    internal_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False, default="mobile_app")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    category = relationship("ReportCategory", lazy="joined")
    media: Mapped[List["ReportMedia"]] = relationship(
        "ReportMedia", back_populates="report", cascade="all, delete-orphan", lazy="selectin"
    )
    status_history: Mapped[List["ReportStatusHistory"]] = relationship(
        "ReportStatusHistory", back_populates="report", cascade="all, delete-orphan", lazy="selectin"
    )
    share_events: Mapped[List["ReportShareEvent"]] = relationship(
        "ReportShareEvent", back_populates="report", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)",
            name="reports_location_check",
        ),
        CheckConstraint("length(description) <= 5000", name="reports_description_length"),
    )
