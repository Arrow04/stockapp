"""Health / root endpoints."""
from fastapi import APIRouter

from app.services.market_data_service import market_data_service

router = APIRouter()


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "Backend is running",
        "provider": market_data_service.provider,
    }


@router.get("/")
async def root():
    return {"message": "Welcome to the SaaS Dashboard API"}
