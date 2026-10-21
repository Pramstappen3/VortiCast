"""Service for computing descriptive analytics and track summaries on recorded storm observations."""

from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundException
from app.repositories.observation_repository import ObservationRepository
from app.repositories.storm_repository import StormRepository
from app.schemas.analytics import StormAnalyticsResponse, TrackPoint
from app.utils.datetime_utils import hours_between, parse_to_utc
from app.utils.geospatial_utils import calculate_speed_kmh, haversine_distance_km


class StormAnalysisService:
    """Computes descriptive analytics for recorded storm tracks."""

    def __init__(self, db: Session):
        self.db = db

    def get_storm_analytics(self, storm_id: int) -> StormAnalyticsResponse:
        storm = StormRepository.get_by_id(self.db, storm_id)
        if not storm:
            raise ResourceNotFoundException("Storm", storm_id)

        observations = ObservationRepository.get_observations_for_storm(self.db, storm_id, limit=2000)
        if not observations:
            return StormAnalyticsResponse(
                storm_id=storm.id,
                external_id=storm.external_id,
                name=storm.name,
                basin=storm.basin,
                total_observations=0,
                start_time=storm.start_time,
                end_time=storm.end_time,
                duration_hours=0.0,
                cumulative_distance_km=0.0,
                track=[],
            )

        # Sort chronologically
        sorted_obs = sorted(observations, key=lambda o: parse_to_utc(o.timestamp_utc))

        track_points = []
        cumulative_distance = 0.0
        max_wind: float | None = None
        min_pres: float | None = None

        for i, obs in enumerate(sorted_obs):
            track_points.append(
                TrackPoint(
                    timestamp_utc=obs.timestamp_utc,
                    latitude=obs.latitude,
                    longitude=obs.longitude,
                    wind_speed_kts=obs.wind_speed_kts,
                    central_pressure_mb=obs.central_pressure_mb,
                )
            )

            if obs.wind_speed_kts is not None:
                max_wind = obs.wind_speed_kts if max_wind is None else max(max_wind, obs.wind_speed_kts)

            if obs.central_pressure_mb is not None:
                min_pres = obs.central_pressure_mb if min_pres is None else min(min_pres, obs.central_pressure_mb)

            if i > 0:
                prev = sorted_obs[i - 1]
                step_km = haversine_distance_km(prev.latitude, prev.longitude, obs.latitude, obs.longitude)
                cumulative_distance += step_km

        start_time = parse_to_utc(sorted_obs[0].timestamp_utc)
        end_time = parse_to_utc(sorted_obs[-1].timestamp_utc)
        duration_hours = max(0.0, hours_between(start_time, end_time))

        avg_speed = calculate_speed_kmh(cumulative_distance, duration_hours)

        return StormAnalyticsResponse(
            storm_id=storm.id,
            external_id=storm.external_id,
            name=storm.name,
            basin=storm.basin,
            total_observations=len(sorted_obs),
            start_time=start_time,
            end_time=end_time,
            duration_hours=round(duration_hours, 1),
            max_wind_speed_kts=max_wind,
            min_central_pressure_mb=min_pres,
            cumulative_distance_km=round(cumulative_distance, 2),
            average_speed_kmh=avg_speed,
            track=track_points,
        )
