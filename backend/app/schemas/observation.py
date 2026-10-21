"""Pydantic schemas for Observation entities."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ObservationBase(BaseModel):
    timestamp_utc: datetime = Field(..., description="Observation timestamp normalized to UTC")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to 180)")
    wind_speed_kts: float | None = Field(None, ge=0.0, le=350.0, description="Wind speed in knots")
    wind_speed_unit: str = Field("knots", description="Unit of wind speed")
    central_pressure_mb: float | None = Field(None, ge=750.0, le=1100.0, description="Central pressure in mb/hPa")
    pressure_unit: str = Field("mb", description="Unit of pressure")
    data_source: str = Field("IBTrACS", description="Data source name")
    source_record_id: str | None = Field(None, description="Identifier in source file")
    quality_indicator: str | None = Field(None, description="Quality flag or missing indicator")

    @field_validator("longitude", mode="before")
    @classmethod
    def normalize_longitude(cls, v: float) -> float:
        """Normalizes longitude into standard -180 to 180 coordinate frame."""
        val = float(v)
        if -180.0 <= val <= 180.0:
            return round(val, 4)
        norm = ((val + 180.0) % 360.0) - 180.0
        if norm == -180.0 and val > 0:
            norm = 180.0
        return round(norm, 4)


class ObservationCreate(ObservationBase):
    storm_id: int


class ObservationResponse(ObservationBase):
    id: int
    storm_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ObservationListResponse(BaseModel):
    total: int
    storm_id: int
    items: list[ObservationResponse]
