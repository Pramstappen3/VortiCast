"""Model evaluation metrics for track displacement and intensity errors."""

from typing import Any

import numpy as np

from app.utils.geospatial_utils import haversine_distance_km


def evaluate_forecasts(
    y_true_coords: list[tuple[float, float]],
    y_pred_coords: list[tuple[float, float]],
    y_true_winds: list[float],
    y_pred_winds: list[float],
    baseline_pred_coords: list[tuple[float, float]] | None = None,
    baseline_pred_winds: list[float] | None = None,
) -> dict[str, Any]:
    """Calculates evaluation metrics comparing forecast predictions against ground truth observations.

    Reports:
    - Great-circle distance error in kilometers (mean, median, min, max).
    - Coordinate MAE (lat/lon).
    - Intensity wind speed MAE and RMSE.
    - Comparison against reference baseline when provided.
    - Honest limitations report.
    """
    n = len(y_true_coords)
    if n == 0:
        return {"error": "No evaluation samples provided"}

    # Track errors (km)
    track_errors_km = [
        haversine_distance_km(true[0], true[1], pred[0], pred[1])
        for true, pred in zip(y_true_coords, y_pred_coords, strict=False)
    ]

    lat_errors = [abs(true[0] - pred[0]) for true, pred in zip(y_true_coords, y_pred_coords, strict=False)]
    lon_errors = [abs(true[1] - pred[1]) for true, pred in zip(y_true_coords, y_pred_coords, strict=False)]

    wind_diffs = [
        pred - true
        for true, pred in zip(y_true_winds, y_pred_winds, strict=False)
    ]
    wind_abs_errors = [abs(d) for d in wind_diffs]
    wind_squared_errors = [d ** 2 for d in wind_diffs]

    track_mean_error_km = float(np.mean(track_errors_km))
    track_median_error_km = float(np.median(track_errors_km))
    wind_mae = float(np.mean(wind_abs_errors))
    wind_rmse = float(np.sqrt(np.mean(wind_squared_errors)))

    report: dict[str, Any] = {
        "sample_count": n,
        "track_metrics": {
            "mean_error_km": round(track_mean_error_km, 2),
            "median_error_km": round(track_median_error_km, 2),
            "max_error_km": round(float(np.max(track_errors_km)), 2),
            "lat_mae_deg": round(float(np.mean(lat_errors)), 3),
            "lon_mae_deg": round(float(np.mean(lon_errors)), 3),
        },
        "intensity_metrics": {
            "wind_mae_kts": round(wind_mae, 2),
            "wind_rmse_kts": round(wind_rmse, 2),
        },
        "limitations": [
            "This model is an educational research prototype, NOT an operational warning system.",
            "Baseline linear dynamics do not account for atmospheric steering or warm sea surface temperatures.",
            "Evaluation metrics reflect performance solely on available historical validation samples.",
        ],
    }

    # Reference benchmark comparison
    if baseline_pred_coords and baseline_pred_winds:
        ref_track_errors_km = [
            haversine_distance_km(true[0], true[1], b_pred[0], b_pred[1])
            for true, b_pred in zip(y_true_coords, baseline_pred_coords, strict=False)
        ]
        ref_wind_abs_errors = [
            abs(b_pred - true)
            for true, b_pred in zip(y_true_winds, baseline_pred_winds, strict=False)
        ]

        ref_track_mean = float(np.mean(ref_track_errors_km))
        ref_wind_mae = float(np.mean(ref_wind_abs_errors))

        report["reference_comparison"] = {
            "reference_benchmark": "Constant-Motion & Persistence",
            "reference_track_mean_error_km": round(ref_track_mean, 2),
            "reference_wind_mae_kts": round(ref_wind_mae, 2),
            "track_skill_improvement_pct": round(
                ((ref_track_mean - track_mean_error_km) / max(0.01, ref_track_mean)) * 100, 2
            ),
            "intensity_skill_improvement_pct": round(
                ((ref_wind_mae - wind_mae) / max(0.01, ref_wind_mae)) * 100, 2
            ),
        }

    return report
