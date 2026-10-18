"""Pydantic schemas for Prediction Change Explanations."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.prediction import PredictionResponse


class ChangedInputItem(BaseModel):
    feature_name: str
    previous_value: Any | None = None
    current_value: Any | None = None
    difference: Any | None = None
    description: str


class EvidenceItem(BaseModel):
    metric: str
    description: str
    raw_data: dict[str, Any] = Field(default_factory=dict)


class PredictionComparisonResponse(BaseModel):
    current_prediction_id: int
    previous_prediction_id: int | None = None
    prediction_changed: bool = Field(..., description="Whether a measurable shift or update occurred")
    track_shift_km: float | None = Field(None, description="Great circle track shift distance in kilometers")
    wind_speed_change_kts: float | None = Field(None, description="Difference in predicted wind speed (knots)")
    previous_model_version: str | None = None
    current_model_version: str | None = None
    variables_changed: list[str] = Field(default_factory=list)
    measured_differences: dict[str, Any] = Field(default_factory=dict)
    changed_inputs: list[ChangedInputItem] = Field(default_factory=list)
    explanation_method: str = Field(..., description="Method used to produce the comparative explanation")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    current_prediction: PredictionResponse | None = None
    previous_prediction: PredictionResponse | None = None

    model_config = ConfigDict(from_attributes=True)
