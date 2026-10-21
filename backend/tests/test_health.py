"""Tests for root and health check endpoints."""

from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient) -> None:
    """Verify that root endpoint returns project metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "VortiCast"
    assert "version" in data
    assert "documentation" in data
    assert "disclaimer" in data


def test_health_endpoint(client: TestClient) -> None:
    """Verify that health check endpoint reports status and model detection."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "VortiCast"
    assert "database" in data
    assert "models" in data
    assert "disclaimer" in data
    assert "track_model_available" in data["models"]
    assert "intensity_model_available" in data["models"]


def test_openapi_schema(client: TestClient) -> None:
    """Verify OpenAPI JSON schema is generated correctly."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "VortiCast"
