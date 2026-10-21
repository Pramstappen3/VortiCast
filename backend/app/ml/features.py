"""Feature extraction and engineering for tropical cyclone forecasting."""

from typing import Any

import numpy as np

from app.models.observation import Observation
from app.utils.datetime_utils import hours_between, parse_to_utc
from app.utils.geospatial_utils import (
    calculate_bearing,
    calculate_speed_kmh,
    haversine_distance_km,
)

FEATURE_NAMES = [
    "curr_lat",
    "curr_lon",
    "prev_lat",
    "prev_lon",
    "lat_diff",
    "lon_diff",
    "distance_traveled_km",
    "bearing_deg",
    "translation_speed_kmh",
    "curr_wind_speed_kts",
    "prev_wind_speed_kts",
    "wind_speed_change_kts",
    "curr_pressure_mb",
    "pressure_change_mb",
    "day_of_year",
    "forecast_horizon_hours",
]


def extract_features_from_sequence(
    observations: list[Observation | dict[str, Any]],
    forecast_horizon_hours: int = 24,
) -> dict[str, float]:
    """Extracts model features from chronological sequence of observations.

    Requires at least 2 chronological observations.
    Never uses future observations to prevent target leakage.
    """
    if len(observations) < 2:
        raise ValueError("At least 2 chronological observations are required to compute motion dynamics.")

    # Standardize to dict format
    def to_dict(obs: Observation | dict[str, Any]) -> dict[str, Any]:
        if isinstance(obs, dict):
            return obs
        return {
            "timestamp_utc": obs.timestamp_utc,
            "latitude": obs.latitude,
            "longitude": obs.longitude,
            "wind_speed_kts": obs.wind_speed_kts,
            "central_pressure_mb": obs.central_pressure_mb,
        }

    # Sort strictly chronologically
    sorted_obs = sorted(
        [to_dict(o) for o in observations],
        key=lambda x: parse_to_utc(x["timestamp_utc"]),
    )

    curr = sorted_obs[-1]
    prev = sorted_obs[-2]

    curr_time = parse_to_utc(curr["timestamp_utc"])
    prev_time = parse_to_utc(prev["timestamp_utc"])

    dt_hours = max(0.1, hours_between(prev_time, curr_time))

    curr_lat = float(curr["latitude"])
    curr_lon = float(curr["longitude"])
    prev_lat = float(prev["latitude"])
    prev_lon = float(prev["longitude"])

    lat_diff = curr_lat - prev_lat
    lon_diff = curr_lon - prev_lon
    if lon_diff > 180.0:
        lon_diff -= 360.0
    elif lon_diff < -180.0:
        lon_diff += 360.0

    dist_km = haversine_distance_km(prev_lat, prev_lon, curr_lat, curr_lon)
    bearing = calculate_bearing(prev_lat, prev_lon, curr_lat, curr_lon)
    speed = calculate_speed_kmh(dist_km, dt_hours) or 0.0

    # Wind speed
    curr_wind = float(curr["wind_speed_kts"]) if curr.get("wind_speed_kts") is not None else 35.0
    prev_wind = float(prev["wind_speed_kts"]) if prev.get("wind_speed_kts") is not None else curr_wind
    wind_diff = curr_wind - prev_wind

    # Pressure
    curr_pres = float(curr["central_pressure_mb"]) if curr.get("central_pressure_mb") is not None else 1005.0
    prev_pres = float(prev["central_pressure_mb"]) if prev.get("central_pressure_mb") is not None else curr_pres
    pres_diff = curr_pres - prev_pres

    day_of_year = float(curr_time.timetuple().tm_yday)

    return {
        "curr_lat": curr_lat,
        "curr_lon": curr_lon,
        "prev_lat": prev_lat,
        "prev_lon": prev_lon,
        "lat_diff": round(lat_diff, 4),
        "lon_diff": round(lon_diff, 4),
        "distance_traveled_km": dist_km,
        "bearing_deg": bearing,
        "translation_speed_kmh": speed,
        "curr_wind_speed_kts": curr_wind,
        "prev_wind_speed_kts": prev_wind,
        "wind_speed_change_kts": round(wind_diff, 2),
        "curr_pressure_mb": curr_pres,
        "pressure_change_mb": round(pres_diff, 2),
        "day_of_year": day_of_year,
        "forecast_horizon_hours": float(forecast_horizon_hours),
    }


def feature_dict_to_array(feature_dict: dict[str, float]) -> np.ndarray:
    """Converts a feature dictionary into an ordered NumPy array for model input."""
    return np.array([[feature_dict[name] for name in FEATURE_NAMES]], dtype=np.float32)
