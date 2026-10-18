"""Pydantic schemas for Prediction requests and responses."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    storm_id: int = Field(..., description="Internal database ID of the storm to forecast")
    forecast_horizon_hours: int = Field(
        24, ge=1, le=120, description="Forecast lead time in hours (e.g. 6, 12, 24, 48)"
    )
    model_name: str | None = Field(None, description="Optional model architecture name override")


class PredictionResponse(BaseModel):
    id: int
    storm_id: int
    issued_at_utc: datetime
    valid_at_utc: datetime
    forecast_horizon_hours: int

    predicted_latitude: float | None = None
    predicted_longitude: float | None = None
    predicted_wind_speed_kts: float | None = None
    wind_speed_unit: str = "knots"

    model_name: str
    model_version: str
    input_snapshot_id: str

    evaluation_metadata: dict[str, Any] | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PredictionHistoryResponse(BaseModel):
    storm_id: int
    total: int
    items: list[PredictionResponse]
