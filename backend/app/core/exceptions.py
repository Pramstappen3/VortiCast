"""Application-specific exceptions and error definitions."""

from typing import Any

from fastapi import Request, status
from fastapi.responses import JSONResponse


class VortiCastException(Exception):
    """Base exception for all VortiCast domain errors."""

    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR", details: Any | None = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}


class ResourceNotFoundException(VortiCastException):
    """Raised when a requested resource (storm, observation, prediction) is not found."""

    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            message=f"{resource_type} with identifier '{resource_id}' was not found.",
            error_code="RESOURCE_NOT_FOUND",
            details={"resource_type": resource_type, "identifier": str(resource_id)},
        )


class ModelNotTrainedException(VortiCastException):
    """Raised when prediction inference is requested but no trained model artifact exists."""

    def __init__(self, model_name: str, path: str):
        super().__init__(
            message=f"Model '{model_name}' has not been trained or artifact is missing at '{path}'.",
            error_code="MODEL_NOT_TRAINED",
            details={"model_name": model_name, "artifact_path": path},
        )


class InsufficientObservationsException(VortiCastException):
    """Raised when a storm has fewer observations than required for feature generation."""

    def __init__(self, storm_id: str, count: int, required: int):
        super().__init__(
            message=f"Storm '{storm_id}' has {count} observation(s); minimum {required} required for prediction.",
            error_code="INSUFFICIENT_OBSERVATIONS",
            details={"storm_id": storm_id, "found": count, "required": required},
        )


class IncompatibleForecastComparisonException(VortiCastException):
    """Raised when comparing predictions with mismatching forecast horizons or storms."""

    def __init__(self, reason: str):
        super().__init__(
            message=f"Cannot compare forecast predictions: {reason}",
            error_code="INCOMPATIBLE_FORECAST_COMPARISON",
            details={"reason": reason},
        )


async def vorticast_exception_handler(request: Request, exc: VortiCastException) -> JSONResponse:
    """FastAPI error handler for domain exceptions."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    if isinstance(exc, ResourceNotFoundException):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, (InsufficientObservationsException, IncompatibleForecastComparisonException)):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, ModelNotTrainedException):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )
