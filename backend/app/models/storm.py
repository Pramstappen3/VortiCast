"""Storm database model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.observation import Observation
    from app.models.prediction import Prediction


class Storm(Base, TimestampMixin):
    """Represents a tropical cyclone storm entity."""

    __tablename__ = "storms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    basin: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_source: Mapped[str] = mapped_column(String(32), default="IBTrACS", nullable=False)

    # Relationships
    observations: Mapped[list["Observation"]] = relationship(
        "Observation",
        back_populates="storm",
        cascade="all, delete-orphan",
        order_by="Observation.timestamp_utc",
    )
    predictions: Mapped[list["Prediction"]] = relationship(
        "Prediction",
        back_populates="storm",
        cascade="all, delete-orphan",
        order_by="Prediction.created_at",
    )

    __table_args__ = (
        Index("idx_storm_basin_time", "basin", "start_time"),
    )
