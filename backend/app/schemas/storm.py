"""Pydantic schemas for Storm entities."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StormBase(BaseModel):
    external_id: str = Field(..., description="Unique storm ID from source (e.g. IBTrACS ID)")
    name: str | None = Field(None, description="Official storm name (e.g. 'OTIS')")
    basin: str = Field(..., description="Basin code (e.g. 'EP', 'NA', 'WP', 'NI')")
    data_source: str = Field("IBTrACS", description="Data source name")


class StormCreate(StormBase):
    start_time: datetime | None = None
    end_time: datetime | None = None


class StormResponse(StormBase):
    id: int
    start_time: datetime | None = None
    end_time: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StormListResponse(BaseModel):
    total: int
    items: list[StormResponse]
