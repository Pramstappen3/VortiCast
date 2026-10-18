"""Models registry importing all models for easy access and Alembic discovery."""

from app.db.base import Base, TimestampMixin
from app.models.explanation import PredictionExplanation
from app.models.observation import Observation
from app.models.prediction import Prediction
from app.models.storm import Storm

__all__ = [
    "Base",
    "Observation",
    "Prediction",
    "PredictionExplanation",
    "Storm",
    "TimestampMixin",
]
