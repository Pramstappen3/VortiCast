"""V1 API router registering all modular endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, predictions, storms

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(storms.router)
api_router.include_router(predictions.router)
