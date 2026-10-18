"""Test configuration and fixtures with SQLite test database."""

from collections.abc import Generator
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db.base import Base
from app.main import app
from app.models.observation import Observation
from app.models.storm import Storm

# In-memory SQLite for test isolation
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db() -> Generator[None, None, None]:
    """Creates database tables for testing session and drops them afterwards."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provides a transactional database session for a single test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Test client overriding the get_db dependency with test session."""
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_storm(db_session: Session) -> Storm:
    """Seeds a sample storm for testing."""
    storm = Storm(
        external_id="TEST_STORM_001",
        name="TEMPEST",
        basin="EP",
        data_source="IBTrACS",
        start_time=datetime(2023, 10, 20, 0, 0, tzinfo=UTC),
        end_time=datetime(2023, 10, 21, 12, 0, tzinfo=UTC),
    )
    db_session.add(storm)
    db_session.commit()
    db_session.refresh(storm)

    # Seed 4 chronological observations
    timestamps = [
        datetime(2023, 10, 20, 0, 0, tzinfo=UTC),
        datetime(2023, 10, 20, 6, 0, tzinfo=UTC),
        datetime(2023, 10, 20, 12, 0, tzinfo=UTC),
        datetime(2023, 10, 20, 18, 0, tzinfo=UTC),
    ]
    coords = [(12.0, -90.0), (12.5, -91.0), (13.0, -92.2), (13.8, -93.5)]
    winds = [35.0, 45.0, 60.0, 75.0]

    for ts, (lat, lon), w in zip(timestamps, coords, winds, strict=False):
        obs = Observation(
            storm_id=storm.id,
            timestamp_utc=ts,
            latitude=lat,
            longitude=lon,
            wind_speed_kts=w,
            wind_speed_unit="knots",
            central_pressure_mb=995.0,
            pressure_unit="mb",
            data_source="IBTrACS",
        )
        db_session.add(obs)
    db_session.commit()

    return storm
