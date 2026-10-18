"""Tests for storms, observations, and analytics endpoints."""

from fastapi.testclient import TestClient

from app.models.storm import Storm


def test_list_storms(client: TestClient, sample_storm: Storm) -> None:
    response = client.get("/api/v1/storms")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    storm_ids = [item["id"] for item in data["items"]]
    assert sample_storm.id in storm_ids


def test_list_storms_basin_filter(client: TestClient, sample_storm: Storm) -> None:
    response = client.get("/api/v1/storms?basin=EP")
    assert response.status_code == 200
    data = response.json()
    assert all(item["basin"] == "EP" for item in data["items"])

    # Filter with non-existent basin
    resp_empty = client.get("/api/v1/storms?basin=NON_EXISTENT")
    assert resp_empty.status_code == 200
    assert resp_empty.json()["total"] == 0


def test_get_storm_by_id(client: TestClient, sample_storm: Storm) -> None:
    response = client.get(f"/api/v1/storms/{sample_storm.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["external_id"] == sample_storm.external_id
    assert data["name"] == "TEMPEST"
    assert data["basin"] == "EP"


def test_get_storm_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/storms/999999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "RESOURCE_NOT_FOUND"


def test_get_storm_observations(client: TestClient, sample_storm: Storm) -> None:
    response = client.get(f"/api/v1/storms/{sample_storm.id}/observations")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 4
    assert len(data["items"]) == 4

    # Verify chronological ordering
    timestamps = [item["timestamp_utc"] for item in data["items"]]
    assert timestamps == sorted(timestamps)


def test_storm_analytics(client: TestClient, sample_storm: Storm) -> None:
    response = client.get(f"/api/v1/storms/{sample_storm.id}/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["storm_id"] == sample_storm.id
    assert data["total_observations"] == 4
    assert data["max_wind_speed_kts"] == 75.0
    assert data["duration_hours"] == 18.0
    assert data["cumulative_distance_km"] > 0
    assert len(data["track"]) == 4
