"""Repository for Prediction and PredictionExplanation entities."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.explanation import PredictionExplanation
from app.models.prediction import Prediction


class PredictionRepository:
    """Data access layer for Prediction and Explanation models."""

    @staticmethod
    def get_by_id(db: Session, prediction_id: int) -> Prediction | None:
        return db.get(Prediction, prediction_id)

    @staticmethod
    def create(db: Session, **kwargs) -> Prediction:
        pred = Prediction(**kwargs)
        db.add(pred)
        db.commit()
        db.refresh(pred)
        return pred

    @staticmethod
    def get_latest_prediction(
        db: Session,
        storm_id: int,
        forecast_horizon_hours: int | None = None,
    ) -> Prediction | None:
        stmt = select(Prediction).where(Prediction.storm_id == storm_id)
        if forecast_horizon_hours is not None:
            stmt = stmt.where(Prediction.forecast_horizon_hours == forecast_horizon_hours)
        stmt = stmt.order_by(Prediction.created_at.desc())
        return db.scalars(stmt).first()

    @staticmethod
    def list_history(
        db: Session,
        storm_id: int,
        forecast_horizon_hours: int | None = None,
        limit: int = 50,
    ) -> list[Prediction]:
        stmt = select(Prediction).where(Prediction.storm_id == storm_id)
        if forecast_horizon_hours is not None:
            stmt = stmt.where(Prediction.forecast_horizon_hours == forecast_horizon_hours)
        stmt = stmt.order_by(Prediction.created_at.asc()).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_previous_prediction(
        db: Session,
        storm_id: int,
        forecast_horizon_hours: int,
        before_timestamp: datetime,
    ) -> Prediction | None:
        """Finds the most recent prior prediction for the same storm and horizon."""
        stmt = (
            select(Prediction)
            .where(
                Prediction.storm_id == storm_id,
                Prediction.forecast_horizon_hours == forecast_horizon_hours,
                Prediction.created_at < before_timestamp,
            )
            .order_by(Prediction.created_at.desc())
        )
        return db.scalars(stmt).first()

    @staticmethod
    def create_explanation(db: Session, **kwargs) -> PredictionExplanation:
        expl = PredictionExplanation(**kwargs)
        db.add(expl)
        db.commit()
        db.refresh(expl)
        return expl

    @staticmethod
    def get_explanation_for_prediction(
        db: Session,
        current_prediction_id: int,
    ) -> PredictionExplanation | None:
        stmt = (
            select(PredictionExplanation)
            .where(PredictionExplanation.current_prediction_id == current_prediction_id)
            .order_by(PredictionExplanation.created_at.desc())
        )
        return db.scalars(stmt).first()
