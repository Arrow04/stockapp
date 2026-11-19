"""Backwards-compatible import location for the market data engine.

The implementation now lives in ``app.services.market_data_service``.
"""
from app.services.market_data_service import (
    CRYPTO_INSTRUMENTS,
    INSTRUMENTS,
    MarketDataEngine,
    MarketDataService,
    Quote,
    engine,
    market_data_service,
)

__all__ = [
    "Quote", "MarketDataEngine", "MarketDataService", "INSTRUMENTS",
    "CRYPTO_INSTRUMENTS", "engine", "market_data_service",
]
