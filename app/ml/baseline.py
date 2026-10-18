"""Baseline models and reference benchmarks for track and intensity forecasting."""

from typing import Any

import numpy as np
from sklearn.linear_model import Ridge

from app.ml.features import FEATURE_NAMES, feature_dict_to_array


class ConstantMotionReferenceModel:
    """Zero-parameter reference benchmark assuming storm maintains constant velocity and intensity."""

    def predict(self, feature_dict: dict[str, float]) -> dict[str, float]:
        curr_lat = feature_dict["curr_lat"]
        curr_lon = feature_dict["curr_lon"]
        lat_diff = feature_dict["lat_diff"]
        lon_diff = feature_dict["lon_diff"]
        curr_wind = feature_dict["curr_wind_speed_kts"]
        horizon_hours = feature_dict["forecast_horizon_hours"]

        # Assume 6-hour standard observation interval for step scaling
        step_factor = horizon_hours / 6.0

        pred_lat = curr_lat + (lat_diff * step_factor)
        pred_lon = curr_lon + (lon_diff * step_factor)
        pred_wind = curr_wind  # Persistence for intensity

        return {
            "predicted_latitude": round(float(pred_lat), 4),
            "predicted_longitude": round(float(pred_lon), 4),
            "predicted_wind_speed_kts": round(float(pred_wind), 1),
        }


class BaselineMLTrackModel:
    """Supervised baseline using Ridge regression to predict position displacement (delta lat, delta lon)."""

    def __init__(self, alpha: float = 1.0):
        self.model_lat = Ridge(alpha=alpha)
        self.model_lon = Ridge(alpha=alpha)
        self.version = "1.0.0"
        self.name = "BaselineRidgeTrackModel"
        self.is_fitted = False

    def fit(self, X: np.ndarray, y_lat_diff: np.ndarray, y_lon_diff: np.ndarray) -> "BaselineMLTrackModel":
        self.model_lat.fit(X, y_lat_diff)
        self.model_lon.fit(X, y_lon_diff)
        self.is_fitted = True
        return self

    def predict(self, feature_dict: dict[str, float]) -> tuple[float, float]:
        if not self.is_fitted:
            raise RuntimeError("Track model has not been trained yet.")
        X = feature_dict_to_array(feature_dict)
        pred_delta_lat = float(self.model_lat.predict(X)[0])
        pred_delta_lon = float(self.model_lon.predict(X)[0])

        final_lat = feature_dict["curr_lat"] + pred_delta_lat
        final_lon = feature_dict["curr_lon"] + pred_delta_lon

        # Constrain coordinates
        final_lat = max(-90.0, min(90.0, final_lat))
        if final_lon > 180.0:
            final_lon = ((final_lon + 180.0) % 360.0) - 180.0
        elif final_lon < -180.0:
            final_lon = ((final_lon - 180.0) % 360.0) + 180.0

        return round(final_lat, 4), round(final_lon, 4)

    def get_feature_importances(self) -> dict[str, Any]:
        """Returns linear coefficients for transparent attribution."""
        if not self.is_fitted:
            return {}
        return {
            "latitude_coefficients": dict(zip(FEATURE_NAMES, self.model_lat.coef_.tolist(), strict=False)),
            "longitude_coefficients": dict(zip(FEATURE_NAMES, self.model_lon.coef_.tolist(), strict=False)),
        }


class BaselineMLIntensityModel:
    """Supervised baseline using Ridge regression to predict wind speed changes."""

    def __init__(self, alpha: float = 1.0):
        self.model_wind = Ridge(alpha=alpha)
        self.version = "1.0.0"
        self.name = "BaselineRidgeIntensityModel"
        self.is_fitted = False

    def fit(self, X: np.ndarray, y_wind_diff: np.ndarray) -> "BaselineMLIntensityModel":
        self.model_wind.fit(X, y_wind_diff)
        self.is_fitted = True
        return self

    def predict(self, feature_dict: dict[str, float]) -> float:
        if not self.is_fitted:
            raise RuntimeError("Intensity model has not been trained yet.")
        X = feature_dict_to_array(feature_dict)
        pred_delta_wind = float(self.model_wind.predict(X)[0])

        final_wind = max(0.0, feature_dict["curr_wind_speed_kts"] + pred_delta_wind)
        return round(final_wind, 1)

    def get_feature_importances(self) -> dict[str, Any]:
        if not self.is_fitted:
            return {}
        return {
            "wind_coefficients": dict(zip(FEATURE_NAMES, self.model_wind.coef_.tolist(), strict=False)),
        }
