"""Tests for dataset ingestion, schema validation, and duplicate detection."""

import pytest
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.storm import Storm
from app.services.ingestion_service import CycloneIngestionService


def test_dry_run_ingestion(db_session: Session) -> None:
    service = CycloneIngestionService(db=db_session)
    summary = service.ingest_csv("tests/data/sample_ibtracs.csv", dry_run=True)

    assert summary.dry_run is True
    assert summary.total_rows_read == 19
    assert summary.observations_imported == 17
    assert summary.observations_rejected == 1
    assert len(summary.storms_identified) == 2

    # Verify no storms or observations were committed
    assert db_session.query(Storm).count() == 0
    assert db_session.query(Observation).count() == 0


def test_database_ingestion_and_duplicates(db_session: Session) -> None:
    service = CycloneIngestionService(db=db_session)

    # First import
    summary1 = service.ingest_csv("tests/data/sample_ibtracs.csv", dry_run=False)
    assert summary1.observations_imported == 17
    assert summary1.storms_created == 2
    assert summary1.observations_skipped_duplicate == 0
    assert db_session.query(Observation).count() == 17

    # Second import: should skip all 17 as duplicates
    summary2 = service.ingest_csv("tests/data/sample_ibtracs.csv", dry_run=False)
    assert summary2.observations_imported == 0
    assert summary2.observations_skipped_duplicate == 17
    assert summary2.storms_created == 0


def test_missing_mandatory_columns(tmp_path, db_session: Session) -> None:
    bad_csv = tmp_path / "bad.csv"
    bad_csv.write_text("SOME_COL,ANOTHER_COL\n1,2\n")

    service = CycloneIngestionService(db=db_session)
    with pytest.raises(ValueError, match="CSV missing mandatory columns"):
        service.ingest_csv(bad_csv)
