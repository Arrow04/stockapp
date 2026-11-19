"""Binance public REST/WS helpers (crypto, kept for the global mode)."""
from app.config import settings

API_BASE = "https://api.binance.com/api/v3"


def is_allowed(symbol: str) -> bool:
    """Normalise and validate a symbol against the allowed-symbol set."""
    return symbol.upper() in settings.allowed_symbols


def stream_url(instruments) -> str:
    """Build the combined Binance ticker stream URL."""
    streams = "/".join(f"{i['binance']}@ticker" for i in instruments)
    return f"wss://stream.binance.com:9443/stream?streams={streams}"


async def fetch_klines(client, symbol: str, interval: str, limit: int):
    response = await client.get(
        f"{API_BASE}/klines",
        params={"symbol": symbol, "interval": interval, "limit": limit},
    )
    response.raise_for_status()
    raw = response.json()
    return [
        {
            "openTime": int(row[0]), "open": float(row[1]),
            "high": float(row[2]), "low": float(row[3]),
            "close": float(row[4]), "volume": float(row[5]),
        }
        for row in raw
    ]


async def fetch_depth(client, symbol: str, limit: int):
    response = await client.get(
        f"{API_BASE}/depth",
        params={"symbol": symbol, "limit": limit},
    )
    response.raise_for_status()
    raw = response.json()
    return {
        "lastUpdateId": int(raw["lastUpdateId"]),
        "bids": [[float(p), float(q)] for p, q in raw["bids"]],
        "asks": [[float(p), float(q)] for p, q in raw["asks"]],
    }


async def fetch_trades(client, symbol: str, limit: int):
    response = await client.get(
        f"{API_BASE}/trades",
        params={"symbol": symbol, "limit": limit},
    )
    response.raise_for_status()
    raw = response.json()
    return [
        {
            "price": float(trade["price"]), "qty": float(trade["qty"]),
            "time": int(trade["time"]), "isBuyerMaker": bool(trade["isBuyerMaker"]),
        }
        for trade in raw
    ]
