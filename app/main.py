"""Main FastAPI application entry point for VortiCast."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import VortiCastException, vorticast_exception_handler
from app.core.logging import logger, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle manager."""
    setup_logging()
    logger.info("Initializing %s v%s in %s mode", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    logger.info("Allowed CORS origins: %s", settings.ALLOWED_ORIGINS)
    yield
    logger.info("Shutting down %s gracefully.", settings.PROJECT_NAME)


def create_application() -> FastAPI:
    """Factory function for FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "VortiCast is an AI-assisted tropical cyclone monitoring, prediction, and analysis research platform. "
            "Designed for educational cyclone tracking, intensity prediction, and explainable forecast comparisons."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Centralized exception handlers
    app.add_exception_handler(VortiCastException, vorticast_exception_handler)

    # API Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/", summary="Root Metadata", tags=["System"])
    def root() -> dict[str, Any]:
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "description": "AI-driven tropical cyclone monitoring and experimental forecasting research platform.",
            "documentation": "/docs",
            "api_v1": settings.API_V1_STR,
            "health": f"{settings.API_V1_STR}/health",
            "disclaimer": "Educational and research prototype. Not an operational forecast service.",
        }

    return app


app = create_application()
