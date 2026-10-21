"""Service for comparing forecast predictions, quantifying track shifts, and explaining changes."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import (
    IncompatibleForecastComparisonException,
    ResourceNotFoundException,
)
from app.models.prediction import Prediction
from app.repositories.prediction_repository import PredictionRepository
from app.schemas.explanation import (
    ChangedInputItem,
    EvidenceItem,
    PredictionComparisonResponse,
)
from app.schemas.prediction import PredictionResponse
from app.utils.geospatial_utils import haversine_distance_km


class PredictionComparisonService:
    """Compares two forecast predictions, computes discrepancies, and builds structured explanations."""

    def __init__(self, db: Session):
        self.db = db

    def compare_predictions(
        self,
        current_pred: Prediction,
        previous_pred: Prediction,
    ) -> PredictionComparisonResponse:
        """Compares two forecast issuances for the same storm and forecast horizon."""
        if current_pred.storm_id != previous_pred.storm_id:
            raise IncompatibleForecastComparisonException(
                f"Cannot compare predictions from different storms ({current_pred.storm_id} vs {previous_pred.storm_id})."
            )

        if current_pred.forecast_horizon_hours != previous_pred.forecast_horizon_hours:
            raise IncompatibleForecastComparisonException(
                f"Forecast horizons differ ({current_pred.forecast_horizon_hours}h vs {previous_pred.forecast_horizon_hours}h)."
            )

        # 1. Quantify track shift (great circle distance)
        track_shift_km: float | None = None
        if (
            current_pred.predicted_latitude is not None
            and current_pred.predicted_longitude is not None
            and previous_pred.predicted_latitude is not None
            and previous_pred.predicted_longitude is not None
        ):
            track_shift_km = haversine_distance_km(
                previous_pred.predicted_latitude,
                previous_pred.predicted_longitude,
                current_pred.predicted_latitude,
                current_pred.predicted_longitude,
            )

        # 2. Quantify wind speed difference
        wind_delta_kts: float | None = None
        if current_pred.predicted_wind_speed_kts is not None and previous_pred.predicted_wind_speed_kts is not None:
            wind_delta_kts = round(current_pred.predicted_wind_speed_kts - previous_pred.predicted_wind_speed_kts, 1)

        # 3. Model version changes
        model_changed = (
            current_pred.model_version != previous_pred.model_version
            or current_pred.model_name != previous_pred.model_name
        )

        variables_changed = []
        measured_diffs: dict[str, Any] = {}

        if track_shift_km is not None and track_shift_km > 0.1:
            variables_changed.append("track_position")
            measured_diffs["track_shift_km"] = track_shift_km
            measured_diffs["lat_diff_deg"] = round(
                (current_pred.predicted_latitude or 0.0) - (previous_pred.predicted_latitude or 0.0), 3
            )
            lon_diff = (current_pred.predicted_longitude or 0.0) - (previous_pred.predicted_longitude or 0.0)
            if lon_diff > 180.0:
                lon_diff -= 360.0
            elif lon_diff < -180.0:
                lon_diff += 360.0
            measured_diffs["lon_diff_deg"] = round(lon_diff, 3)

        if wind_delta_kts is not None and abs(wind_delta_kts) > 0.1:
            variables_changed.append("wind_speed")
            measured_diffs["wind_speed_change_kts"] = wind_delta_kts

        if model_changed:
            variables_changed.append("model_configuration")
            measured_diffs["model_change"] = {
                "previous": f"{previous_pred.model_name}:{previous_pred.model_version}",
                "current": f"{current_pred.model_name}:{current_pred.model_version}",
            }

        # 4. Compare input snapshots
        changed_inputs: list[ChangedInputItem] = []
        curr_eval = current_pred.evaluation_metadata or {}
        prev_eval = previous_pred.evaluation_metadata or {}

        curr_features = curr_eval.get("features_snapshot", {})
        prev_features = prev_eval.get("features_snapshot", {})

        if curr_features and prev_features:
            for feat_name, curr_val in curr_features.items():
                prev_val = prev_features.get(feat_name)
                if prev_val is not None and curr_val != prev_val:
                    diff = (
                        round(curr_val - prev_val, 3)
                        if isinstance(curr_val, (int, float)) and isinstance(prev_val, (int, float))
                        else "modified"
                    )
                    changed_inputs.append(
                        ChangedInputItem(
                            feature_name=feat_name,
                            previous_value=prev_val,
                            current_value=curr_val,
                            difference=diff,
                            description=f"Feature '{feat_name}' shifted from {prev_val} to {curr_val} (delta: {diff}).",
                        )
                    )
        elif current_pred.input_snapshot_id != previous_pred.input_snapshot_id:
            changed_inputs.append(
                ChangedInputItem(
                    feature_name="input_snapshot_id",
                    previous_value=previous_pred.input_snapshot_id,
                    current_value=current_pred.input_snapshot_id,
                    difference="updated_snapshot",
                    description="New observations were ingested between forecast issuances.",
                )
            )

        # 5. Build Evidence
        evidence = [
            EvidenceItem(
                metric="track_shift",
                description=f"Predicted center shifted by {track_shift_km} km over {current_pred.forecast_horizon_hours}h horizon.",
                raw_data={
                    "previous_coords": [previous_pred.predicted_latitude, previous_pred.predicted_longitude],
                    "current_coords": [current_pred.predicted_latitude, current_pred.predicted_longitude],
                    "shift_km": track_shift_km,
                },
            ),
            EvidenceItem(
                metric="wind_intensity",
                description=f"Predicted wind changed by {wind_delta_kts} knots ({previous_pred.predicted_wind_speed_kts} -> {current_pred.predicted_wind_speed_kts} kts).",
                raw_data={
                    "previous_wind_kts": previous_pred.predicted_wind_speed_kts,
                    "current_wind_kts": current_pred.predicted_wind_speed_kts,
                    "delta_kts": wind_delta_kts,
                },
            ),
        ]

        # 6. Honest Scientific Limitations (preventing unsupported causal claims)
        limitations = [
            "Quantified track and intensity shifts represent measured differences between forecast runs, NOT proven physical causation.",
            "Atmospheric environmental drivers (sea surface temperature, vertical wind shear) are not causally attributed unless explicitly modeled.",
            "If model versions or input observation intervals changed, shifts reflect combined effects of new inputs and algorithmic updates.",
        ]

        prediction_changed = len(variables_changed) > 0

        # Construct explanation record in DB
        explanation_record = PredictionRepository.get_explanation_for_prediction(self.db, current_pred.id)
        if not explanation_record:
            explanation_record = PredictionRepository.create_explanation(
                self.db,
                current_prediction_id=current_pred.id,
                previous_prediction_id=previous_pred.id,
                track_shift_km=track_shift_km,
                wind_speed_change_kts=wind_delta_kts,
                variables_changed=variables_changed,
                measured_differences=measured_diffs,
                identified_input_changes={"changed_features": [item.model_dump() for item in changed_inputs]},
                model_version_changed=model_changed,
                previous_model_version=previous_pred.model_version,
                current_model_version=current_pred.model_version,
                explanation_method="RULE_BASED_METRIC_DIFFERENCING_AND_PROVENANCE",
                evidence=[e.model_dump() for e in evidence],
                limitations=limitations,
            )

        return PredictionComparisonResponse(
            current_prediction_id=current_pred.id,
            previous_prediction_id=previous_pred.id,
            prediction_changed=prediction_changed,
            track_shift_km=track_shift_km,
            wind_speed_change_kts=wind_delta_kts,
            previous_model_version=previous_pred.model_version,
            current_model_version=current_pred.model_version,
            variables_changed=variables_changed,
            measured_differences=measured_diffs,
            changed_inputs=changed_inputs,
            explanation_method="RULE_BASED_METRIC_DIFFERENCING_AND_PROVENANCE",
            evidence=evidence,
            limitations=limitations,
            created_at=explanation_record.created_at,
            current_prediction=PredictionResponse.model_validate(current_pred),
            previous_prediction=PredictionResponse.model_validate(previous_pred) if previous_pred else None,
        )

    def explain_prediction_changes(self, prediction_id: int) -> PredictionComparisonResponse:
        """Finds the previous prediction for the same storm and horizon, and returns the comparative explanation."""
        current_pred = PredictionRepository.get_by_id(self.db, prediction_id)
        if not current_pred:
            raise ResourceNotFoundException("Prediction", prediction_id)

        previous_pred = PredictionRepository.get_previous_prediction(
            self.db,
            storm_id=current_pred.storm_id,
            forecast_horizon_hours=current_pred.forecast_horizon_hours,
            before_timestamp=current_pred.created_at,
        )

        if not previous_pred:
            # Baseline issuance: no earlier forecast exists to compare against
            return PredictionComparisonResponse(
                current_prediction_id=current_pred.id,
                previous_prediction_id=None,
                prediction_changed=False,
                track_shift_km=None,
                wind_speed_change_kts=None,
                previous_model_version=None,
                current_model_version=current_pred.model_version,
                variables_changed=[],
                measured_differences={},
                changed_inputs=[],
                explanation_method="INITIAL_ISSUANCE_NO_PRIOR_FORECAST",
                evidence=[
                    EvidenceItem(
                        metric="initial_forecast",
                        description=f"This is the initial stored prediction for storm {current_pred.storm_id} at {current_pred.forecast_horizon_hours}h horizon.",
                    )
                ],
                limitations=[
                    "No earlier forecast exists for this storm and horizon. Change analysis requires at least two successive runs.",
                ],
                created_at=datetime.now(UTC),
                current_prediction=PredictionResponse.model_validate(current_pred),
                previous_prediction=None,
            )

        return self.compare_predictions(current_pred, previous_pred)
