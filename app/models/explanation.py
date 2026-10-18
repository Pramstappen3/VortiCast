"""PredictionExplanation database model for tracking forecast differences and evidence."""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, get_utc_now

if TYPE_CHECKING:
    from app.models.prediction import Prediction


class PredictionExplanation(Base):
    """Stores structured comparisons and explanations between two forecast predictions."""

    __tablename__ = "prediction_explanations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    current_prediction_id: Mapped[int] = mapped_column(
        ForeignKey("predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    previous_prediction_id: Mapped[int] = mapped_column(
        ForeignKey("predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    track_shift_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_change_kts: Mapped[float | None] = mapped_column(Float, nullable=True)

    variables_changed: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    measured_differences: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    identified_input_changes: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    model_version_changed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    previous_model_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    current_model_version: Mapped[str | None] = mapped_column(String(32), nullable=True)

    explanation_method: Mapped[str] = mapped_column(
        String(64),
        default="METRIC_DIFFERENCING_AND_PROVENANCE",
        nullable=False,
    )
    evidence: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    limitations: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=get_utc_now,
        index=True,
        nullable=False,
    )

    # Relationships
    current_prediction: Mapped["Prediction"] = relationship(
        "Prediction",
        foreign_keys=[current_prediction_id],
        back_populates="explanations_as_current",
    )
    previous_prediction: Mapped["Prediction"] = relationship(
        "Prediction",
        foreign_keys=[previous_prediction_id],
        back_populates="explanations_as_previous",
    )
