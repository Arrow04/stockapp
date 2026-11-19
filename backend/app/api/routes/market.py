"""Market data controllers: REST proxies and the WebSocket feed."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.market_data_service import market_data_service

router = APIRouter()


@router.get("/api/quotes")
async def quotes():
    """Current market snapshot (polling fallback)."""
    return market_data_service.snapshot()


@router.get("/api/klines")
async def klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 60):
    """Proxy klines/candlestick data (Yahoo for India, Binance for crypto)."""
    return await market_data_service.klines(symbol, interval, limit)


@router.get("/api/depth")
async def depth(symbol: str = "BTCUSDT", limit: int = 10):
    """Proxy Binance public order-book depth."""
    return await market_data_service.depth(symbol, limit)


@router.get("/api/trades")
async def trades(symbol: str = "BTCUSDT", limit: int = 20):
    """Proxy Binance public recent-trades feed."""
    return await market_data_service.trades(symbol, limit)


@router.websocket("/ws/market-data")
async def market_data_ws(websocket: WebSocket):
    """Stream live market ticks to the dashboard."""
    await market_data_service.add_client(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep connection alive; ignore client msgs
    except WebSocketDisconnect:
        market_data_service.remove_client(websocket)
