import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from packages.shared.database import Base
from packages.shared.schemas.enums import GuideResourceType


class GuideResource(Base):
    __tablename__ = "guide_resources"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    guide_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("guides.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_type: Mapped[GuideResourceType] = mapped_column(
        Enum(GuideResourceType, name="guide_resource_type", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    media_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    guide = relationship("Guide", back_populates="resources")

    __table_args__ = (
        CheckConstraint("duration_seconds IS NULL OR duration_seconds >= 0", name="guide_resources_duration_check"),
    )
