"""Repository for Storm entities."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.storm import Storm


class StormRepository:
    """Data access layer for Storm models."""

    @staticmethod
    def get_by_id(db: Session, storm_id: int) -> Storm | None:
        return db.get(Storm, storm_id)

    @staticmethod
    def get_by_external_id(db: Session, external_id: str) -> Storm | None:
        stmt = select(Storm).where(Storm.external_id == external_id)
        return db.scalars(stmt).first()

    @staticmethod
    def list_storms(
        db: Session,
        basin: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Storm]:
        stmt = select(Storm)
        if basin:
            stmt = stmt.where(Storm.basin == basin)
        stmt = stmt.order_by(Storm.start_time.desc().nullslast()).offset(skip).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def count(db: Session, basin: str | None = None) -> int:
        stmt = select(func.count(Storm.id))
        if basin:
            stmt = stmt.where(Storm.basin == basin)
        return db.scalar(stmt) or 0

    @staticmethod
    def create(db: Session, **kwargs) -> Storm:
        storm = Storm(**kwargs)
        db.add(storm)
        db.commit()
        db.refresh(storm)
        return storm

    @staticmethod
    def update_time_bounds(
        db: Session,
        storm_id: int,
        start_time: datetime | None,
        end_time: datetime | None,
    ) -> Storm | None:
        from app.utils.datetime_utils import parse_to_utc

        storm = db.get(Storm, storm_id)
        if not storm:
            return None
        if start_time:
            st_utc = parse_to_utc(start_time)
            curr_start = parse_to_utc(storm.start_time) if storm.start_time else None
            if curr_start is None or st_utc < curr_start:
                storm.start_time = st_utc
        if end_time:
            et_utc = parse_to_utc(end_time)
            curr_end = parse_to_utc(storm.end_time) if storm.end_time else None
            if curr_end is None or et_utc > curr_end:
                storm.end_time = et_utc
        db.commit()
        db.refresh(storm)
        return storm
