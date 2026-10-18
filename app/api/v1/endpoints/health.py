"""Health check endpoint providing status of API, database, and model artifacts."""

import os
from typing import Any

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health Check", tags=["System"])
def get_health() -> dict[str, Any]:
    """Returns the operational status of VortiCast, database mode, and available model artifacts.

    Note: VortiCast is an educational and research prototype, not an operational cyclone warning system.
    """
    # Check model artifacts
    track_model_path = os.path.join(settings.ARTIFACTS_DIR, "baseline_track_model.joblib")
    intensity_model_path = os.path.join(settings.ARTIFACTS_DIR, "baseline_intensity_model.joblib")

    model_status = {
        "track_model_available": os.path.exists(track_model_path),
        "intensity_model_available": os.path.exists(intensity_model_path),
    }

    # Database connectivity check (simple detection without crashing)
    db_engine = "postgresql" if "postgresql" in settings.DATABASE_URL else "sqlite"
    db_status = {
        "configured_engine": db_engine,
        "is_production": settings.ENVIRONMENT == "production",
    }

    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "models": model_status,
        "disclaimer": (
            "VortiCast is an educational and research prototype, not an official or operational weather-warning system. "
            "Never describe unvalidated model output as an official cyclone forecast."
        ),
    }
