"""Endpoints for querying Storms, Observations, and Track Analytics."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.exceptions import ResourceNotFoundException
from app.repositories.observation_repository import ObservationRepository
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.storm_repository import StormRepository
from app.schemas.analytics import StormAnalyticsResponse
from app.schemas.observation import ObservationListResponse, ObservationResponse
from app.schemas.prediction import PredictionHistoryResponse, PredictionResponse
from app.schemas.storm import StormListResponse, StormResponse
from app.services.storm_analysis_service import StormAnalysisService

router = APIRouter(prefix="/storms", tags=["Storms"])


@router.get("", response_model=StormListResponse, summary="List Storms")
def list_storms(
    basin: Annotated[str | None, Query(description="Filter by oceanic basin (e.g. EP, NA, WP, NI)")] = None,
    skip: Annotated[int, Query(ge=0, description="Offset for pagination")] = 0,
    limit: Annotated[int, Query(ge=1, le=200, description="Page limit")] = 50,
    db: Session = Depends(get_db),
) -> StormListResponse:
    """Retrieves a paginated list of tropical cyclones with optional basin filtering."""
    total = StormRepository.count(db, basin=basin)
    storms = StormRepository.list_storms(db, basin=basin, skip=skip, limit=limit)
    return StormListResponse(
        total=total,
        items=[StormResponse.model_validate(s) for s in storms],
    )


@router.get("/{storm_id}", response_model=StormResponse, summary="Get Storm Metadata")
def get_storm(
    storm_id: int,
    db: Session = Depends(get_db),
) -> StormResponse:
    """Retrieves metadata for a specific storm by internal database ID."""
    storm = StormRepository.get_by_id(db, storm_id)
    if not storm:
        raise ResourceNotFoundException("Storm", storm_id)
    return StormResponse.model_validate(storm)


@router.get("/{storm_id}/observations", response_model=ObservationListResponse, summary="List Storm Observations")
def get_storm_observations(
    storm_id: int,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=2000)] = 500,
    db: Session = Depends(get_db),
) -> ObservationListResponse:
    """Retrieves chronological observations recorded for a storm."""
    storm = StormRepository.get_by_id(db, storm_id)
    if not storm:
        raise ResourceNotFoundException("Storm", storm_id)

    total = ObservationRepository.count_for_storm(db, storm_id)
    obs = ObservationRepository.get_observations_for_storm(db, storm_id, skip=skip, limit=limit)
    return ObservationListResponse(
        total=total,
        storm_id=storm_id,
        items=[ObservationResponse.model_validate(o) for o in obs],
    )


@router.get("/{storm_id}/predictions/latest", response_model=PredictionResponse, summary="Latest Storm Prediction")
def get_latest_prediction(
    storm_id: int,
    forecast_horizon_hours: Annotated[int | None, Query(ge=1, le=120)] = None,
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Returns the most recently issued forecast prediction for the specified storm."""
    storm = StormRepository.get_by_id(db, storm_id)
    if not storm:
        raise ResourceNotFoundException("Storm", storm_id)

    pred = PredictionRepository.get_latest_prediction(db, storm_id, forecast_horizon_hours=forecast_horizon_hours)
    if not pred:
        raise ResourceNotFoundException(f"Prediction for storm {storm_id}", "latest")
    return PredictionResponse.model_validate(pred)


@router.get(
    "/{storm_id}/predictions/history", response_model=PredictionHistoryResponse, summary="Storm Prediction History"
)
def get_prediction_history(
    storm_id: int,
    forecast_horizon_hours: Annotated[int | None, Query(ge=1, le=120)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    db: Session = Depends(get_db),
) -> PredictionHistoryResponse:
    """Returns historical forecast versions in chronological order for comparing prior issuances."""
    storm = StormRepository.get_by_id(db, storm_id)
    if not storm:
        raise ResourceNotFoundException("Storm", storm_id)

    preds = PredictionRepository.list_history(
        db,
        storm_id=storm_id,
        forecast_horizon_hours=forecast_horizon_hours,
        limit=limit,
    )
    return PredictionHistoryResponse(
        storm_id=storm_id,
        total=len(preds),
        items=[PredictionResponse.model_validate(p) for p in preds],
    )


@router.get("/{storm_id}/analytics", response_model=StormAnalyticsResponse, summary="Get Storm Analytics")
def get_storm_analytics(
    storm_id: int,
    db: Session = Depends(get_db),
) -> StormAnalyticsResponse:
    """Returns computed descriptive statistics, cumulative distance, and track coordinates."""
    service = StormAnalysisService(db)
    return service.get_storm_analytics(storm_id)
