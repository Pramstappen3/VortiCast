"""Endpoints for generating predictions and inspecting forecast change explanations."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.exceptions import ResourceNotFoundException
from app.repositories.prediction_repository import PredictionRepository
from app.schemas.explanation import PredictionComparisonResponse
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.prediction_comparison_service import PredictionComparisonService
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED, summary="Generate Prediction")
def generate_prediction(
    request: PredictionRequest,
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Generates an experimental track and intensity forecast for a storm at the given forecast horizon.

    Requires that a baseline model artifact has been trained.
    Returns 503 Service Unavailable if model artifact is missing.
    """
    service = PredictionService(db)
    return service.generate_prediction(request)


@router.get("/{prediction_id}", response_model=PredictionResponse, summary="Get Prediction Details")
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Retrieves full details of an immutable prediction issuance."""
    pred = PredictionRepository.get_by_id(db, prediction_id)
    if not pred:
        raise ResourceNotFoundException("Prediction", prediction_id)
    return PredictionResponse.model_validate(pred)


@router.get(
    "/{prediction_id}/changes", response_model=PredictionComparisonResponse, summary="Explain Prediction Changes"
)
def get_prediction_changes(
    prediction_id: int,
    db: Session = Depends(get_db),
) -> PredictionComparisonResponse:
    """Compares the specified prediction with the previous prediction for the same storm and horizon.

    Quantifies:
    - Great-circle track shift in kilometers.
    - Wind speed change in knots.
    - Identifies changed input features and model versions.
    - Provides verifiable evidence and honest scientific limitations.
    """
    comparison_service = PredictionComparisonService(db)
    return comparison_service.explain_prediction_changes(prediction_id)
