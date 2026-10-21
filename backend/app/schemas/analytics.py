"""Pydantic schemas for Storm Analytics and Track Summaries."""

from datetime import datetime

from pydantic import BaseModel, Field


class TrackPoint(BaseModel):
    timestamp_utc: datetime
    latitude: float
    longitude: float
    wind_speed_kts: float | None = None
    central_pressure_mb: float | None = None


class StormAnalyticsResponse(BaseModel):
    storm_id: int
    external_id: str
    name: str | None = None
    basin: str
    total_observations: int
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_hours: float | None = None
    max_wind_speed_kts: float | None = None
    min_central_pressure_mb: float | None = None
    cumulative_distance_km: float = Field(0.0, description="Total distance traveled along track in km")
    average_speed_kmh: float | None = Field(None, description="Average forward movement speed in km/h")
    track: list[TrackPoint] = Field(default_factory=list)
