"""Observation database model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, get_utc_now

if TYPE_CHECKING:
    from app.models.storm import Storm


class Observation(Base):
    """Represents a validated meteorological observation for a storm."""

    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    storm_id: Mapped[int] = mapped_column(ForeignKey("storms.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    wind_speed_kts: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_unit: Mapped[str] = mapped_column(String(16), default="knots", nullable=False)

    central_pressure_mb: Mapped[float | None] = mapped_column(Float, nullable=True)
    pressure_unit: Mapped[str] = mapped_column(String(16), default="mb", nullable=False)

    data_source: Mapped[str] = mapped_column(String(32), default="IBTrACS", nullable=False)
    source_record_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    quality_indicator: Mapped[str | None] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        nullable=False,
    )

    # Relationships
    storm: Mapped["Storm"] = relationship("Storm", back_populates="observations")

    __table_args__ = (
        UniqueConstraint("storm_id", "timestamp_utc", "data_source", name="uq_storm_obs_source"),
        Index("idx_obs_storm_time", "storm_id", "timestamp_utc"),
    )
