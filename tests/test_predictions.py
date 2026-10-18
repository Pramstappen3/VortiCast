"""Tests for prediction generation, versioning, and retrieval."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.exceptions import ModelNotTrainedException
from app.ml.inference import InferenceEngine
from app.models.storm import Storm


def test_prediction_request_validation(client: TestClient) -> None:
    # Invalid horizon (< 1)
    res = client.post("/api/v1/predictions", json={"storm_id": 1, "forecast_horizon_hours": 0})
    assert res.status_code == 422

    # Non-existent storm
    res_not_found = client.post("/api/v1/predictions", json={"storm_id": 99999, "forecast_horizon_hours": 24})
    assert res_not_found.status_code == 404
    assert res_not_found.json()["error"] == "RESOURCE_NOT_FOUND"


def test_missing_model_artifacts_error(client: TestClient, sample_storm: Storm, monkeypatch) -> None:
    def fake_load(*args, **kwargs):
        raise ModelNotTrainedException("BaselineTrackModel", "/fake/path")

    monkeypatch.setattr(InferenceEngine, "load_track_model", fake_load)

    res = client.post("/api/v1/predictions", json={"storm_id": sample_storm.id, "forecast_horizon_hours": 24})
    assert res.status_code == 503
    assert res.json()["error"] == "MODEL_NOT_TRAINED"


def test_generate_and_retrieve_prediction(client: TestClient, sample_storm: Storm) -> None:
    # Generate prediction (models are already trained and saved in data/artifacts)
    res = client.post("/api/v1/predictions", json={"storm_id": sample_storm.id, "forecast_horizon_hours": 24})
    assert res.status_code == 201
    pred_data = res.json()
    assert pred_data["storm_id"] == sample_storm.id
    assert pred_data["forecast_horizon_hours"] == 24
    assert pred_data["predicted_latitude"] is not None
    assert pred_data["predicted_longitude"] is not None
    assert pred_data["predicted_wind_speed_kts"] is not None
    assert pred_data["status"] == "completed"

    pred_id = pred_data["id"]

    # Retrieve single prediction
    res_get = client.get(f"/api/v1/predictions/{pred_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == pred_id

    # Retrieve latest prediction for storm
    res_latest = client.get(f"/api/v1/storms/{sample_storm.id}/predictions/latest")
    assert res_latest.status_code == 200
    assert res_latest.json()["id"] == pred_id

    # Retrieve history
    res_history = client.get(f"/api/v1/storms/{sample_storm.id}/predictions/history")
    assert res_history.status_code == 200
    assert res_history.json()["total"] >= 1
    assert res_history.json()["items"][0]["id"] == pred_id


def test_insufficient_observations(client: TestClient, db_session: Session) -> None:
    # Create storm with only 1 observation
    lonely_storm = Storm(external_id="LONE_001", name="SOLO", basin="EP", data_source="IBTrACS")
    db_session.add(lonely_storm)
    db_session.commit()

    res = client.post("/api/v1/predictions", json={"storm_id": lonely_storm.id, "forecast_horizon_hours": 24})
    assert res.status_code == 400
    assert res.json()["error"] == "INSUFFICIENT_OBSERVATIONS"
