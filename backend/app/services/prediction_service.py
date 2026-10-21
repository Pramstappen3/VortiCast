"""Prediction service for orchestrating feature extraction, model inference, and immutable forecast persistence."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import (
    InsufficientObservationsException,
    ResourceNotFoundException,
)
from app.ml.features import extract_features_from_sequence
from app.ml.inference import InferenceEngine
from app.repositories.observation_repository import ObservationRepository
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.storm_repository import StormRepository
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.utils.datetime_utils import parse_to_utc


class PredictionService:
    """Orchestrates cyclone prediction generation and version storage."""

    def __init__(self, db: Session, inference_engine: InferenceEngine | None = None):
        self.db = db
        self.engine = inference_engine or InferenceEngine()

    def generate_prediction(self, request: PredictionRequest) -> PredictionResponse:
        """Validates observations, executes inference, and persists an immutable prediction record."""
        storm = StormRepository.get_by_id(self.db, request.storm_id)
        if not storm:
            raise ResourceNotFoundException("Storm", request.storm_id)

        # Retrieve chronological observations
        observations = ObservationRepository.get_observations_for_storm(
            self.db,
            request.storm_id,
            limit=1000,
        )

        if len(observations) < 2:
            raise InsufficientObservationsException(
                storm_id=str(request.storm_id),
                count=len(observations),
                required=2,
            )

        # Sort chronologically
        sorted_obs = sorted(observations, key=lambda o: parse_to_utc(o.timestamp_utc))
        latest_obs = sorted_obs[-1]
        issuance_time = parse_to_utc(latest_obs.timestamp_utc)
        valid_time = issuance_time + timedelta(hours=request.forecast_horizon_hours)

        # Feature engineering from past sequence (no future target leakage)
        features = extract_features_from_sequence(
            sorted_obs,
            forecast_horizon_hours=request.forecast_horizon_hours,
        )

        # Inference
        infer_result = self.engine.predict(features)

        # Input snapshot ID based on latest observation timestamp and observation count
        snapshot_id = f"{storm.external_id}_obs{len(sorted_obs)}_{issuance_time.strftime('%Y%m%d%H%M')}"

        eval_metadata = {
            "features_snapshot": features,
            "observations_count": len(sorted_obs),
            "latest_observation_id": latest_obs.id,
            "horizon_hours": request.forecast_horizon_hours,
        }

        # Save immutable prediction
        pred_record = PredictionRepository.create(
            self.db,
            storm_id=storm.id,
            issued_at_utc=issuance_time,
            valid_at_utc=valid_time,
            forecast_horizon_hours=request.forecast_horizon_hours,
            predicted_latitude=infer_result["predicted_latitude"],
            predicted_longitude=infer_result["predicted_longitude"],
            predicted_wind_speed_kts=infer_result["predicted_wind_speed_kts"],
            wind_speed_unit="knots",
            model_name=infer_result["track_model_name"],
            model_version=infer_result["track_model_version"],
            input_snapshot_id=snapshot_id,
            evaluation_metadata=eval_metadata,
            status="completed",
        )

        return PredictionResponse.model_validate(pred_record)
