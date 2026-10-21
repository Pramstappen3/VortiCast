"""Prediction database model for immutable forecast versioning."""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, get_utc_now

if TYPE_CHECKING:
    from app.models.explanation import PredictionExplanation
    from app.models.storm import Storm


class Prediction(Base):
    """Represents an immutable forecast issuance."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    storm_id: Mapped[int] = mapped_column(ForeignKey("storms.id", ondelete="CASCADE"), index=True, nullable=False)

    issued_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    valid_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    forecast_horizon_hours: Mapped[int] = mapped_column(Integer, index=True, nullable=False)

    predicted_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    predicted_wind_speed_kts: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_unit: Mapped[str] = mapped_column(String(16), default="knots", nullable=False)

    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    input_snapshot_id: Mapped[str] = mapped_column(String(128), nullable=False)

    evaluation_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="completed", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        index=True,
        nullable=False,
    )

    # Relationships
    storm: Mapped["Storm"] = relationship("Storm", back_populates="predictions")
    explanations_as_current: Mapped[list["PredictionExplanation"]] = relationship(
        "PredictionExplanation",
        foreign_keys="PredictionExplanation.current_prediction_id",
        back_populates="current_prediction",
        cascade="all, delete-orphan",
    )
    explanations_as_previous: Mapped[list["PredictionExplanation"]] = relationship(
        "PredictionExplanation",
        foreign_keys="PredictionExplanation.previous_prediction_id",
        back_populates="previous_prediction",
    )

    __table_args__ = (Index("idx_pred_storm_horizon_time", "storm_id", "forecast_horizon_hours", "created_at"),)
