"""Inference engine for loading serialized models and generating forecasts."""

from pathlib import Path
from typing import Any

import joblib

from app.core.config import settings
from app.core.exceptions import ModelNotTrainedException
from app.ml.baseline import BaselineMLIntensityModel, BaselineMLTrackModel

TRACK_MODEL_FILE = "baseline_track_model.joblib"
INTENSITY_MODEL_FILE = "baseline_intensity_model.joblib"


class InferenceEngine:
    """Manages model artifact lifecycle and forecast generation."""

    def __init__(self, artifacts_dir: str | Path | None = None):
        self.artifacts_dir = Path(artifacts_dir or settings.ARTIFACTS_DIR)
        self._track_model: BaselineMLTrackModel | None = None
        self._intensity_model: BaselineMLIntensityModel | None = None

    def get_track_model_path(self) -> Path:
        return self.artifacts_dir / TRACK_MODEL_FILE

    def get_intensity_model_path(self) -> Path:
        return self.artifacts_dir / INTENSITY_MODEL_FILE

    def is_track_model_available(self) -> bool:
        return self.get_track_model_path().is_file()

    def is_intensity_model_available(self) -> bool:
        return self.get_intensity_model_path().is_file()

    def load_track_model(self) -> BaselineMLTrackModel:
        if self._track_model is not None:
            return self._track_model
        path = self.get_track_model_path()
        if not path.is_file():
            raise ModelNotTrainedException(model_name="BaselineTrackModel", path=str(path))
        self._track_model = joblib.load(path)
        return self._track_model

    def load_intensity_model(self) -> BaselineMLIntensityModel:
        if self._intensity_model is not None:
            return self._intensity_model
        path = self.get_intensity_model_path()
        if not path.is_file():
            raise ModelNotTrainedException(model_name="BaselineIntensityModel", path=str(path))
        self._intensity_model = joblib.load(path)
        return self._intensity_model

    def predict(self, feature_dict: dict[str, float]) -> dict[str, Any]:
        """Runs track and intensity models to generate a forecast."""
        track_model = self.load_track_model()
        intensity_model = self.load_intensity_model()

        pred_lat, pred_lon = track_model.predict(feature_dict)
        pred_wind = intensity_model.predict(feature_dict)

        return {
            "predicted_latitude": pred_lat,
            "predicted_longitude": pred_lon,
            "predicted_wind_speed_kts": pred_wind,
            "track_model_name": track_model.name,
            "track_model_version": track_model.version,
            "intensity_model_name": intensity_model.name,
            "intensity_model_version": intensity_model.version,
        }
