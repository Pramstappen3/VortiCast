"""Tests for prediction change explanation endpoints and evidence provenance."""

from fastapi.testclient import TestClient

from app.models.storm import Storm


def test_initial_prediction_explanation(client: TestClient, sample_storm: Storm) -> None:
    # First prediction issuance
    res_pred = client.post("/api/v1/predictions", json={"storm_id": sample_storm.id, "forecast_horizon_hours": 24})
    assert res_pred.status_code == 201
    pred_id = res_pred.json()["id"]

    # Request change explanation for the first issuance
    res_expl = client.get(f"/api/v1/predictions/{pred_id}/changes")
    assert res_expl.status_code == 200
    data = res_expl.json()

    assert data["current_prediction_id"] == pred_id
    assert data["previous_prediction_id"] is None
    assert data["prediction_changed"] is False
    assert data["explanation_method"] == "INITIAL_ISSUANCE_NO_PRIOR_FORECAST"
    assert len(data["limitations"]) > 0


def test_consecutive_prediction_explanations(client: TestClient, sample_storm: Storm) -> None:
    # Issue forecast 1
    res1 = client.post("/api/v1/predictions", json={"storm_id": sample_storm.id, "forecast_horizon_hours": 24})
    assert res1.status_code == 201
    pred1_id = res1.json()["id"]

    # Issue forecast 2
    res2 = client.post("/api/v1/predictions", json={"storm_id": sample_storm.id, "forecast_horizon_hours": 24})
    assert res2.status_code == 201
    pred2_id = res2.json()["id"]

    # Request explanation on forecast 2
    res_expl = client.get(f"/api/v1/predictions/{pred2_id}/changes")
    assert res_expl.status_code == 200
    data = res_expl.json()

    assert data["current_prediction_id"] == pred2_id
    assert data["previous_prediction_id"] == pred1_id
    assert "explanation_method" in data
    assert "limitations" in data
    assert "evidence" in data
    assert len(data["evidence"]) >= 1

    # Verify that limitations strictly prevent unsupported causal claims
    limitations_text = " ".join(data["limitations"])
    assert "NOT proven physical causation" in limitations_text or "measured differences" in limitations_text
