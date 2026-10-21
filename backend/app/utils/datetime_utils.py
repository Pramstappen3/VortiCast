"""Date and time parsing and conversion utilities."""

from datetime import UTC, datetime

import dateutil.parser


def parse_to_utc(date_input: str | datetime) -> datetime:
    """Parses arbitrary date input into a timezone-aware UTC datetime."""
    if isinstance(date_input, datetime):
        if date_input.tzinfo is None:
            return date_input.replace(tzinfo=UTC)
        return date_input.astimezone(UTC)

    dt = dateutil.parser.parse(str(date_input))
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def hours_between(dt_early: datetime, dt_later: datetime) -> float:
    """Returns the hours between two datetimes."""
    utc_early = parse_to_utc(dt_early)
    utc_later = parse_to_utc(dt_later)
    return (utc_later - utc_early).total_seconds() / 3600.0
