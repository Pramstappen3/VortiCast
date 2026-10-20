"""Tests for forecast prediction comparison logic and distance metrics."""

from datetime import UTC, datetime

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import IncompatibleForecastComparisonException
from app.models.prediction import Prediction
from app.services.prediction_comparison_service import PredictionComparisonService


def test_forecast_comparison_calculation(db_session: Session) -> None:
    service = PredictionComparisonService(db=db_session)

    pred1 = Prediction(
        storm_id=1,
        issued_at_utc=datetime(2023, 10, 20, 12, 0, tzinfo=UTC),
        valid_at_utc=datetime(2023, 10, 21, 12, 0, tzinfo=UTC),
        forecast_horizon_hours=24,
        predicted_latitude=14.0,
        predicted_longitude=-92.0,
        predicted_wind_speed_kts=60.0,
        model_name="BaselineTrackModel",
        model_version="1.0.0",
        input_snapshot_id="snap_1",
        created_at=datetime(2023, 10, 20, 12, 1, tzinfo=UTC),
        status="completed",
    )
    pred2 = Prediction(
        storm_id=1,
        issued_at_utc=datetime(2023, 10, 20, 18, 0, tzinfo=UTC),
        valid_at_utc=datetime(2023, 10, 21, 18, 0, tzinfo=UTC),
        forecast_horizon_hours=24,
        predicted_latitude=14.5,
        predicted_longitude=-92.5,
        predicted_wind_speed_kts=70.0,
        model_name="BaselineTrackModel",
        model_version="1.0.0",
        input_snapshot_id="snap_2",
        created_at=datetime(2023, 10, 20, 18, 1, tzinfo=UTC),
        status="completed",
    )
    db_session.add_all([pred1, pred2])
    db_session.commit()

    comparison = service.compare_predictions(pred2, pred1)

    assert comparison.prediction_changed is True
    assert comparison.track_shift_km is not None
    # 0.5 deg lat & 0.5 deg lon is approximately 75-80 km at 14 deg N
    assert 70.0 < comparison.track_shift_km < 90.0
    assert comparison.wind_speed_change_kts == 10.0
    assert "track_position" in comparison.variables_changed
    assert "wind_speed" in comparison.variables_changed
    assert len(comparison.evidence) >= 2


def test_incompatible_storms_comparison(db_session: Session) -> None:
    service = PredictionComparisonService(db=db_session)
    now = datetime.now(UTC)
    pred1 = Prediction(
        storm_id=1,
        forecast_horizon_hours=24,
        issued_at_utc=now,
        valid_at_utc=now,
        model_name="M",
        model_version="1",
        input_snapshot_id="1",
    )
    pred2 = Prediction(
        storm_id=2,
        forecast_horizon_hours=24,
        issued_at_utc=now,
        valid_at_utc=now,
        model_name="M",
        model_version="1",
        input_snapshot_id="2",
    )

    with pytest.raises(IncompatibleForecastComparisonException, match="Cannot compare predictions from different storms"):
        service.compare_predictions(pred2, pred1)


def test_incompatible_horizons_comparison(db_session: Session) -> None:
    service = PredictionComparisonService(db=db_session)
    now = datetime.now(UTC)
    pred1 = Prediction(
        storm_id=1,
        forecast_horizon_hours=24,
        issued_at_utc=now,
        valid_at_utc=now,
        model_name="M",
        model_version="1",
        input_snapshot_id="1",
    )
    pred2 = Prediction(
        storm_id=1,
        forecast_horizon_hours=48,
        issued_at_utc=now,
        valid_at_utc=now,
        model_name="M",
        model_version="1",
        input_snapshot_id="2",
    )

    with pytest.raises(IncompatibleForecastComparisonException, match="Forecast horizons differ"):
        service.compare_predictions(pred2, pred1)
