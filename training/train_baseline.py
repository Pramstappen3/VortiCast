#!/usr/bin/env python3
"""Train baseline ML models for track and intensity prediction."""

import json
import sys
from pathlib import Path

import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.db.session import SessionLocal
from app.ml.baseline import (
    BaselineMLIntensityModel,
    BaselineMLTrackModel,
    ConstantMotionReferenceModel,
)
from app.ml.evaluation import evaluate_forecasts
from training.prepare_dataset import prepare_dataset_from_db


def train() -> None:
    print("Connecting to database to extract training samples...")
    db = SessionLocal()
    try:
        train_data, test_data, train_raw, test_raw = prepare_dataset_from_db(db, forecast_horizon_hours=24)
    except Exception as e:
        print(f"\n[ERROR] Could not prepare dataset: {e}")
        print("Please import historical observations first using:")
        print("  python scripts/import_dataset.py --file data/raw/sample_ibtracs.csv\n")
        return
    finally:
        db.close()

    X_train = train_data["X"]
    if len(X_train) == 0:
        print("\n[WARNING] No viable 24-hour lead-time samples found in current database.")
        print("Cyclone tracks must span at least 24 hours to form valid training pairs.")
        return

    print(f"Dataset prepared: {len(X_train)} training samples, {len(test_data['X'])} evaluation samples.")

    # 1. Train Track Model
    print("Training Baseline Track Model (Ridge Regression on displacements)...")
    track_model = BaselineMLTrackModel(alpha=1.0)
    track_model.fit(X_train, train_data["delta_lat"], train_data["delta_lon"])

    # 2. Train Intensity Model
    print("Training Baseline Intensity Model (Ridge Regression on intensity deltas)...")
    intensity_model = BaselineMLIntensityModel(alpha=1.0)
    intensity_model.fit(X_train, train_data["delta_wind"])

    # Ensure artifacts directory exists
    artifacts_dir = Path(settings.ARTIFACTS_DIR)
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    track_path = artifacts_dir / "baseline_track_model.joblib"
    intensity_path = artifacts_dir / "baseline_intensity_model.joblib"

    joblib.dump(track_model, track_path)
    joblib.dump(intensity_model, intensity_path)
    print(f"Artifacts successfully saved to:\n  - {track_path}\n  - {intensity_path}")

    # 3. Evaluate on test set (or train if test is empty)
    eval_raw = test_raw if len(test_raw) > 0 else train_raw

    y_true_coords = [(s["target_lat"], s["target_lon"]) for s in eval_raw]
    y_true_winds = [s["target_wind"] for s in eval_raw]

    y_pred_coords = []
    y_pred_winds = []
    ref_coords = []
    ref_winds = []

    ref_model = ConstantMotionReferenceModel()

    for s in eval_raw:
        feat = s["features"]
        plat, plon = track_model.predict(feat)
        pwind = intensity_model.predict(feat)
        y_pred_coords.append((plat, plon))
        y_pred_winds.append(pwind)

        # Baseline reference
        ref_out = ref_model.predict(feat)
        ref_coords.append((ref_out["predicted_latitude"], ref_out["predicted_longitude"]))
        ref_winds.append(ref_out["predicted_wind_speed_kts"])

    metrics = evaluate_forecasts(
        y_true_coords=y_true_coords,
        y_pred_coords=y_pred_coords,
        y_true_winds=y_true_winds,
        y_pred_winds=y_pred_winds,
        baseline_pred_coords=ref_coords,
        baseline_pred_winds=ref_winds,
    )

    print("\n--- Evaluation Report ---")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    train()
