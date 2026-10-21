"""Repository for Observation entities."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.observation import Observation


class ObservationRepository:
    """Data access layer for Observation models."""

    @staticmethod
    def get_by_id(db: Session, observation_id: int) -> Observation | None:
        return db.get(Observation, observation_id)

    @staticmethod
    def get_observations_for_storm(
        db: Session,
        storm_id: int,
        skip: int = 0,
        limit: int = 1000,
    ) -> list[Observation]:
        stmt = (
            select(Observation)
            .where(Observation.storm_id == storm_id)
            .order_by(Observation.timestamp_utc.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_latest_observations(
        db: Session,
        storm_id: int,
        n: int = 5,
    ) -> list[Observation]:
        """Returns the most recent N observations ordered chronologically (oldest to newest)."""
        stmt = (
            select(Observation)
            .where(Observation.storm_id == storm_id)
            .order_by(Observation.timestamp_utc.desc())
            .limit(n)
        )
        records = list(db.scalars(stmt).all())
        records.reverse()
        return records

    @staticmethod
    def count_for_storm(db: Session, storm_id: int) -> int:
        stmt = select(func.count(Observation.id)).where(Observation.storm_id == storm_id)
        return db.scalar(stmt) or 0

    @staticmethod
    def exists(
        db: Session,
        storm_id: int,
        timestamp_utc: datetime,
        data_source: str,
    ) -> bool:
        stmt = select(Observation.id).where(
            Observation.storm_id == storm_id,
            Observation.timestamp_utc == timestamp_utc,
            Observation.data_source == data_source,
        )
        return db.scalar(stmt) is not None

    @staticmethod
    def create(db: Session, **kwargs) -> Observation:
        obs = Observation(**kwargs)
        db.add(obs)
        db.commit()
        db.refresh(obs)
        return obs

    @staticmethod
    def create_batch(db: Session, observations: list[Observation]) -> int:
        if not observations:
            return 0
        db.add_all(observations)
        db.commit()
        return len(observations)
