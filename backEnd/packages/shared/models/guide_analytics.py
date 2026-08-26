import uuid
from datetime import date
from sqlalchemy import Date, ForeignKey, Integer, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from packages.shared.database import Base


class GuideAnalyticsDaily(Base):
    __tablename__ = "guide_analytics_daily"

    guide_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("guides.id", ondelete="CASCADE"),
        primary_key=True,
    )
    day: Mapped[date] = mapped_column(
        Date,
        primary_key=True,
        server_default=func.current_date(),
    )
    views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    helpful: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    shares: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    guide = relationship("Guide")
