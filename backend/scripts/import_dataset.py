#!/usr/bin/env python3
"""Command-line script for importing cyclone observation datasets into VortiCast."""

import argparse
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.logging import setup_logging
from app.db.session import SessionLocal
from app.services.ingestion_service import CycloneIngestionService


def main() -> None:
    setup_logging()
    parser = argparse.ArgumentParser(description="VortiCast Cyclone Dataset Ingestion Tool")
    parser.add_argument("--file", "-f", required=True, help="Path to input CSV file")
    parser.add_argument("--dry-run", action="store_true", help="Perform validation without inserting into database")
    parser.add_argument("--source", default="IBTrACS", help="Data source tag (default: IBTrACS)")

    args = parser.parse_args()

    db = SessionLocal()
    try:
        service = CycloneIngestionService(db=db)
        print(f"Starting ingestion of {args.file} (Dry Run: {args.dry_run}, Source: {args.source})...")
        summary = service.ingest_csv(args.file, dry_run=args.dry_run, data_source=args.source)
        print("\n--- Ingestion Summary ---")
        print(json.dumps(summary.to_dict(), indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
