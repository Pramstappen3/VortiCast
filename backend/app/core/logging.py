"""Centralized logging configuration for VortiCast."""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """Configures application-wide logging format and level."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logging_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=log_level,
        format=logging_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Silence overly verbose loggers if in production
    if not settings.DEBUG:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


logger = logging.getLogger("vorticast")
