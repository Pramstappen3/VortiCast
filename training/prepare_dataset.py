"""Dataset preparation and storm-aware chronological splitting."""

from typing import Any

import numpy as np
from sqlalchemy.orm import Session

from app.ml.features import FEATURE_NAMES, extract_features_from_sequence
from app.models.observation import Observation
from app.models.storm import Storm
from app.utils.datetime_utils import hours_between, parse_to_utc


def build_samples_for_storm(
    observations: list[Observation],
    forecast_horizon_hours: int = 24,
    tolerance_hours: float = 3.0,
) -> list[dict[str, Any]]:
    """Generates feature-target training samples from a single storm track without leakage."""
    if len(observations) < 3:
        return []

    sorted_obs = sorted(observations, key=lambda o: parse_to_utc(o.timestamp_utc))
    samples = []

    # Slide a window across the storm track
    for i in range(1, len(sorted_obs)):
        issuance_obs = sorted_obs[i]
        issuance_time = parse_to_utc(issuance_obs.timestamp_utc)

        # Observations available strictly up to issuance_time (no target leakage)
        history = sorted_obs[: i + 1]

        # Search for valid ground truth observation at ~issuance_time + forecast_horizon_hours
        target_obs = None
        for future_obs in sorted_obs[i + 1 :]:
            f_time = parse_to_utc(future_obs.timestamp_utc)
            delta_h = hours_between(issuance_time, f_time)
            if abs(delta_h - forecast_horizon_hours) <= tolerance_hours:
                target_obs = future_obs
                break

        if target_obs is not None:
            features = extract_features_from_sequence(history, forecast_horizon_hours)
            target_lat = target_obs.latitude
            target_lon = target_obs.longitude
            target_wind = (
                target_obs.wind_speed_kts if target_obs.wind_speed_kts is not None else features["curr_wind_speed_kts"]
            )

            delta_lat = target_lat - features["curr_lat"]
            delta_lon = target_lon - features["curr_lon"]
            delta_wind = target_wind - features["curr_wind_speed_kts"]

            samples.append(
                {
                    "features": features,
                    "target_lat": target_lat,
                    "target_lon": target_lon,
                    "target_wind": target_wind,
                    "delta_lat": delta_lat,
                    "delta_lon": delta_lon,
                    "delta_wind": delta_wind,
                }
            )

    return samples


def prepare_dataset_from_db(
    db: Session,
    forecast_horizon_hours: int = 24,
    test_storm_ratio: float = 0.25,
) -> tuple[dict[str, np.ndarray], dict[str, np.ndarray], list[dict], list[dict]]:
    """Extracts features across storms and creates a storm-aware holdout split."""
    storms = db.query(Storm).all()
    if not storms:
        raise ValueError("No storms found in the database. Please import a dataset first.")

    train_samples: list[dict[str, Any]] = []
    test_samples: list[dict[str, Any]] = []

    # Chronological split by storm start_time
    sorted_storms = sorted(
        storms,
        key=lambda s: parse_to_utc(s.start_time) if s.start_time else parse_to_utc("1970-01-01"),
    )

    split_idx = max(1, int(len(sorted_storms) * (1.0 - test_storm_ratio)))
    train_storms = sorted_storms[:split_idx]
    test_storms = sorted_storms[split_idx:] if len(sorted_storms) > 1 else sorted_storms

    for s in train_storms:
        train_samples.extend(build_samples_for_storm(s.observations, forecast_horizon_hours))

    for s in test_storms:
        test_samples.extend(build_samples_for_storm(s.observations, forecast_horizon_hours))

    def to_matrices(sample_list: list[dict[str, Any]]) -> dict[str, np.ndarray]:
        if not sample_list:
            return {
                "X": np.empty((0, len(FEATURE_NAMES))),
                "delta_lat": np.empty(0),
                "delta_lon": np.empty(0),
                "delta_wind": np.empty(0),
            }
        X = np.array([[s["features"][name] for name in FEATURE_NAMES] for s in sample_list], dtype=np.float32)
        delta_lat = np.array([s["delta_lat"] for s in sample_list], dtype=np.float32)
        delta_lon = np.array([s["delta_lon"] for s in sample_list], dtype=np.float32)
        delta_wind = np.array([s["delta_wind"] for s in sample_list], dtype=np.float32)
        return {
            "X": X,
            "delta_lat": delta_lat,
            "delta_lon": delta_lon,
            "delta_wind": delta_wind,
        }

    return to_matrices(train_samples), to_matrices(test_samples), train_samples, test_samples
