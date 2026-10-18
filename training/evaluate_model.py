#!/usr/bin/env python3
"""Evaluate saved baseline models against recent observations."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.ml.baseline import ConstantMotionReferenceModel
from app.ml.evaluation import evaluate_forecasts
from app.ml.inference import InferenceEngine
from training.prepare_dataset import prepare_dataset_from_db


def main() -> None:
    engine = InferenceEngine()
    if not (engine.is_track_model_available() and engine.is_intensity_model_available()):
        print("[ERROR] Models are not trained or artifacts are missing.")
        print("Run `python training/train_baseline.py` first.")
        sys.exit(1)

    db = SessionLocal()
    try:
        _, _, _, test_raw = prepare_dataset_from_db(db, forecast_horizon_hours=24)
    finally:
        db.close()

    if not test_raw:
        print("[WARNING] No test samples available for evaluation.")
        return

    ref_model = ConstantMotionReferenceModel()
    y_true_coords = [(s["target_lat"], s["target_lon"]) for s in test_raw]
    y_true_winds = [s["target_wind"] for s in test_raw]

    y_pred_coords = []
    y_pred_winds = []
    ref_coords = []
    ref_winds = []

    for s in test_raw:
        feat = s["features"]
        res = engine.predict(feat)
        y_pred_coords.append((res["predicted_latitude"], res["predicted_longitude"]))
        y_pred_winds.append(res["predicted_wind_speed_kts"])

        ref_res = ref_model.predict(feat)
        ref_coords.append((ref_res["predicted_latitude"], ref_res["predicted_longitude"]))
        ref_winds.append(ref_res["predicted_wind_speed_kts"])

    metrics = evaluate_forecasts(
        y_true_coords=y_true_coords,
        y_pred_coords=y_pred_coords,
        y_true_winds=y_true_winds,
        y_pred_winds=y_pred_winds,
        baseline_pred_coords=ref_coords,
        baseline_pred_winds=ref_winds,
    )
    print("\n--- Model Evaluation Report ---")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
