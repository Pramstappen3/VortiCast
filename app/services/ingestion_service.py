"""Service for ingesting and validating cyclone datasets from CSV sources."""

import csv
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.observation import Observation
from app.models.storm import Storm
from app.repositories.observation_repository import ObservationRepository
from app.repositories.storm_repository import StormRepository
from app.schemas.observation import ObservationBase
from app.utils.datetime_utils import parse_to_utc


class IngestionSummary:
    """Summary metrics of an ingestion run."""

    def __init__(self, filename: str, dry_run: bool = False):
        self.filename = filename
        self.dry_run = dry_run
        self.total_rows_read: int = 0
        self.storms_created: int = 0
        self.storms_identified: set[str] = set()
        self.observations_imported: int = 0
        self.observations_skipped_duplicate: int = 0
        self.observations_rejected: int = 0
        self.rejection_reasons: list[dict[str, Any]] = []

    def to_dict(self) -> dict[str, Any]:
        return {
            "filename": self.filename,
            "dry_run": self.dry_run,
            "total_rows_read": self.total_rows_read,
            "storms_count": len(self.storms_identified),
            "storms_created": self.storms_created,
            "observations_imported": self.observations_imported,
            "observations_skipped_duplicate": self.observations_skipped_duplicate,
            "observations_rejected": self.observations_rejected,
            "rejection_sample": self.rejection_reasons[:10],
        }


# Default mapping supporting NOAA IBTrACS standard columns
DEFAULT_IBTRACS_MAPPING = {
    "storm_id": ["SID", "storm_id", "STORM_ID", "sid"],
    "storm_name": ["NAME", "storm_name", "STORM_NAME", "name"],
    "basin": ["BASIN", "basin", "ocean_basin"],
    "timestamp": ["ISO_TIME", "iso_time", "timestamp", "datetime", "time"],
    "latitude": ["LAT", "lat", "latitude", "LATITUDE"],
    "longitude": ["LON", "lon", "longitude", "LONGITUDE"],
    "wind_speed": ["USA_WIND", "WMO_WIND", "wind_speed", "max_wind_kts", "wind"],
    "central_pressure": ["USA_PRES", "WMO_PRES", "central_pressure", "min_pres_mb", "pressure"],
}


class CycloneIngestionService:
    """Handles ingestion, schema validation, normalization, and insertion of cyclone data."""

    def __init__(self, db: Session | None = None):
        self.db = db

    @staticmethod
    def _find_field_name(row: dict[str, str], candidate_names: list[str]) -> str | None:
        """Finds the first matching key present in the CSV row header."""
        for candidate in candidate_names:
            if candidate in row:
                return candidate
        return None

    def ingest_csv(
        self,
        file_path: str | Path,
        mapping: dict[str, list[str]] | None = None,
        dry_run: bool = False,
        data_source: str = "IBTrACS",
    ) -> IngestionSummary:
        """Parses, validates, and imports observations from a CSV file."""
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"File not found: {file_path}")

        field_mapping = mapping or DEFAULT_IBTRACS_MAPPING
        summary = IngestionSummary(filename=path.name, dry_run=dry_run)

        # Cache of storms external_id -> Storm
        storm_cache: dict[str, Storm] = {}

        with open(path, encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []

            # Resolve actual column names in this file
            id_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["storm_id"])
            time_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["timestamp"])
            lat_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["latitude"])
            lon_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["longitude"])

            if not (id_col and time_col and lat_col and lon_col):
                raise ValueError(
                    f"CSV missing mandatory columns. Found headers: {fieldnames}. "
                    f"Requires storm_id ({field_mapping['storm_id']}), time ({field_mapping['timestamp']}), "
                    f"lat ({field_mapping['latitude']}), and lon ({field_mapping['longitude']})."
                )

            name_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["storm_name"])
            basin_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["basin"])
            wind_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["wind_speed"])
            pres_col = self._find_field_name({c: "" for c in fieldnames}, field_mapping["central_pressure"])

            # Keep track of storm observation time ranges for bounds update
            storm_time_ranges: dict[int, dict[str, datetime]] = {}

            row_num = 0
            for row in reader:
                row_num += 1
                summary.total_rows_read += 1

                # Detect and skip IBTrACS secondary units row (e.g., LAT has 'deg_north')
                if row.get(lat_col, "").strip() in ("deg_north", "degree", "units", "deg"):
                    continue

                raw_storm_id = (row.get(id_col) or "").strip()
                if not raw_storm_id or raw_storm_id == "":
                    summary.observations_rejected += 1
                    summary.rejection_reasons.append({"row": row_num, "reason": "Missing storm identifier"})
                    continue

                raw_time = (row.get(time_col) or "").strip()
                raw_lat = (row.get(lat_col) or "").strip()
                raw_lon = (row.get(lon_col) or "").strip()

                try:
                    ts_utc = parse_to_utc(raw_time)
                except Exception as e:
                    summary.observations_rejected += 1
                    summary.rejection_reasons.append({"row": row_num, "reason": f"Invalid timestamp '{raw_time}': {e}"})
                    continue

                # Parse wind speed (never treat empty as 0)
                raw_wind = (row.get(wind_col) or "").strip() if wind_col else ""
                wind_speed_kts: float | None = None
                if raw_wind and raw_wind not in ("-999", "NOT_SET", "NA", "null", "None", ""):
                    try:
                        wind_speed_kts = float(raw_wind)
                    except ValueError:
                        pass

                # Parse central pressure
                raw_pres = (row.get(pres_col) or "").strip() if pres_col else ""
                central_pres_mb: float | None = None
                if raw_pres and raw_pres not in ("-999", "NOT_SET", "NA", "null", "None", ""):
                    try:
                        central_pres_mb = float(raw_pres)
                    except ValueError:
                        pass

                # Validate with Pydantic
                try:
                    valid_obs = ObservationBase(
                        timestamp_utc=ts_utc,
                        latitude=float(raw_lat),
                        longitude=float(raw_lon),
                        wind_speed_kts=wind_speed_kts,
                        wind_speed_unit="knots",
                        central_pressure_mb=central_pres_mb,
                        pressure_unit="mb",
                        data_source=data_source,
                        source_record_id=str(row_num),
                    )
                except (ValidationError, ValueError) as val_err:
                    summary.observations_rejected += 1
                    summary.rejection_reasons.append({"row": row_num, "reason": f"Validation error: {val_err}"})
                    continue

                summary.storms_identified.add(raw_storm_id)

                if dry_run or not self.db:
                    summary.observations_imported += 1
                    continue

                # Database insertion path
                storm = storm_cache.get(raw_storm_id)
                if not storm:
                    storm = StormRepository.get_by_external_id(self.db, raw_storm_id)
                    if not storm:
                        storm_name = (row.get(name_col) or "").strip() if name_col else None
                        basin = (row.get(basin_col) or "").strip() if basin_col else "UN"
                        if storm_name in ("NOT_NAMED", "UNNAMED", ""):
                            storm_name = None
                        if not basin:
                            basin = "UN"

                        storm = StormRepository.create(
                            self.db,
                            external_id=raw_storm_id,
                            name=storm_name,
                            basin=basin,
                            data_source=data_source,
                            start_time=valid_obs.timestamp_utc,
                            end_time=valid_obs.timestamp_utc,
                        )
                        summary.storms_created += 1
                    storm_cache[raw_storm_id] = storm

                # Check duplicate observation
                if ObservationRepository.exists(self.db, storm.id, valid_obs.timestamp_utc, data_source):
                    summary.observations_skipped_duplicate += 1
                    continue

                # Create observation record
                obs_record = Observation(
                    storm_id=storm.id,
                    timestamp_utc=valid_obs.timestamp_utc,
                    latitude=valid_obs.latitude,
                    longitude=valid_obs.longitude,
                    wind_speed_kts=valid_obs.wind_speed_kts,
                    wind_speed_unit=valid_obs.wind_speed_unit,
                    central_pressure_mb=valid_obs.central_pressure_mb,
                    pressure_unit=valid_obs.pressure_unit,
                    data_source=valid_obs.data_source,
                    source_record_id=valid_obs.source_record_id,
                )
                self.db.add(obs_record)
                summary.observations_imported += 1

                # Update time ranges
                t_range = storm_time_ranges.setdefault(
                    storm.id, {"start": valid_obs.timestamp_utc, "end": valid_obs.timestamp_utc}
                )
                t_range["start"] = min(t_range["start"], valid_obs.timestamp_utc)
                t_range["end"] = max(t_range["end"], valid_obs.timestamp_utc)

            if not dry_run and self.db:
                self.db.commit()
                # Update storm start/end bounds
                for st_id, bounds in storm_time_ranges.items():
                    StormRepository.update_time_bounds(self.db, st_id, bounds["start"], bounds["end"])

        logger.info(
            "Ingestion completed for %s: %d imported, %d skipped, %d rejected",
            path.name,
            summary.observations_imported,
            summary.observations_skipped_duplicate,
            summary.observations_rejected,
        )
        return summary
