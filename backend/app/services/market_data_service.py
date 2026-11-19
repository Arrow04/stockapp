"""Market data engine and service.

The engine feeds a standardised quote stream to WebSocket clients; the
service façade adds the cached klines/depth/trades REST operations. Provider
configuration comes from ``app.config`` only.
"""
import asyncio
import json
import random
import time
from dataclasses import asdict, dataclass

import httpx
import websockets

from app.config import settings
from app.core.errors import MarketDataError
from app.data import binance, yahoo
from app.repositories.market_cache import MarketCache

# ---------------------------------------------------------------------------
# Demo / broker instrument universe
# ---------------------------------------------------------------------------
INSTRUMENTS = [
    {"symbol": "NIFTY 50", "name": "Nifty 50 Index", "base": 24012.35,
     "fyers": "NSE:NIFTY50-INDEX", "upstox": "NSE_INDEX|Nifty 50", "angel": "nse_index|Nifty 50"},
    {"symbol": "BANKNIFTY", "name": "Nifty Bank", "base": 51230.40,
     "fyers": "NSE:BANKNIFTY-INDEX", "upstox": "NSE_INDEX|Nifty Bank", "angel": "nse_index|Nifty Bank"},
    {"symbol": "RELIANCE", "name": "Reliance Industries", "base": 2845.50,
     "fyers": "NSE:RELIANCE-EQ", "upstox": "NSE_EQ|INE002A01018", "angel": "nse_eq|INE002A01018"},
    {"symbol": "TCS", "name": "Tata Consultancy", "base": 3920.10,
     "fyers": "NSE:TCS-EQ", "upstox": "NSE_EQ|INE467B01029", "angel": "nse_eq|INE467B01029"},
    {"symbol": "INFY", "name": "Infosys Ltd", "base": 1786.40,
     "fyers": "NSE:INFY-EQ", "upstox": "NSE_EQ|INE009A01021", "angel": "nse_eq|INE009A01021"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "base": 1542.75,
     "fyers": "NSE:HDFCBANK-EQ", "upstox": "NSE_EQ|INE040A01034", "angel": "nse_eq|INE040A01034"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank", "base": 1098.30,
     "fyers": "NSE:ICICIBANK-EQ", "upstox": "NSE_EQ|INE090A01021", "angel": "nse_eq|INE090A01021"},
]

# ---------------------------------------------------------------------------
# Real public feed (Binance) — no auth required
# ---------------------------------------------------------------------------
CRYPTO_INSTRUMENTS = [
    {"symbol": "BTC/USDT", "name": "Bitcoin", "base": 62000, "binance": "btcusdt", "market": "CRYPTO", "currency": "USDT"},
    {"symbol": "ETH/USDT", "name": "Ethereum", "base": 3000, "binance": "ethusdt", "market": "CRYPTO", "currency": "USDT"},
    {"symbol": "BNB/USDT", "name": "BNB", "base": 600, "binance": "bnbusdt", "market": "CRYPTO", "currency": "USDT"},
    {"symbol": "SOL/USDT", "name": "Solana", "base": 150, "binance": "solusdt", "market": "CRYPTO", "currency": "USDT"},
    {"symbol": "XRP/USDT", "name": "XRP", "base": 0.55, "binance": "xrpusdt", "market": "CRYPTO", "currency": "USDT"},
    {"symbol": "ADA/USDT", "name": "Cardano", "base": 0.45, "binance": "adausdt", "market": "CRYPTO", "currency": "USDT"},
    {"symbol": "DOGE/USDT", "name": "Dogecoin", "base": 0.12, "binance": "dogeusdt", "market": "CRYPTO", "currency": "USDT"},
]


@dataclass
class Quote:
    symbol: str
    name: str
    ltp: float
    open: float
    high: float
    low: float
    close: float
    change: float
    change_pct: float
    volume: float
    ts: int
    market: str = "CRYPTO"      # CRYPTO | US | INDIA
    currency: str = "USDT"      # USDT | USD | INR


def _build(inst, ltp, close, volume=0, open_=None, high=None, low=None):
    if open_ is None:
        open_ = close * (1 + random.uniform(-0.004, 0.004))
    if high is None:
        high = max(ltp, close) * (1 + random.uniform(0, 0.006))
    if low is None:
        low = min(ltp, close) * (1 - random.uniform(0, 0.006))
    change = ltp - close
    return Quote(
        symbol=inst["symbol"], name=inst["name"], ltp=round(float(ltp), 4),
        open=round(float(open_), 4), high=round(float(high), 4), low=round(float(low), 4),
        close=round(float(close), 4), change=round(float(change), 4),
        change_pct=round((change / close * 100) if close else 0, 2),
        volume=float(volume), ts=int(time.time() * 1000),
        market=inst.get("market", "CRYPTO"),
        currency=inst.get("currency", "USDT"),
    )


class MarketDataEngine:
    """Provider-agnostic real-time quote engine (moved from market_data.py)."""

    def __init__(self, config):
        self.provider = config.market_data_provider
        self.india_only = self.provider == "india"
        self.instruments = [] if self.india_only else (
            CRYPTO_INSTRUMENTS if self.provider == "public" else INSTRUMENTS
        )
        self.currency = "INR" if self.india_only else (
            "USDT" if self.provider == "public" else "INR"
        )
        self.quotes: dict[str, Quote] = {}
        self.clients: set = set()
        self._task = None
        self._listener = None
        self._stocks_task = None
        self._india_task = None
        self.enable_india = config.enable_india
        self.enable_us = config.enable_us
        # broker credentials
        self.fyers_token = config.fyers_token
        self.upstox_token = config.upstox_token
        self.angel_token = config.angel_token
        self.angel_key = config.angel_key
        for inst in self.instruments:
            self.quotes[inst["symbol"]] = _build(inst, inst["base"], inst["base"])
        # Seed US stocks (global mode only).
        if self.enable_us:
            for inst in yahoo.US_STOCKS:
                meta = dict(inst, market="US", currency="USD")
                self.quotes[inst["symbol"]] = _build(meta, inst["base"], inst["base"])
        # Seed Indian stocks (NSE + BSE) when enabled.
        if self.enable_india:
            for inst in yahoo.INDIA_STOCKS:
                disp = yahoo._india_display(inst["symbol"])
                meta = dict(inst, symbol=disp, market="INDIA", currency="INR")
                self.quotes[disp] = _build(meta, inst["base"], inst["base"])

    # ----- lifecycle -------------------------------------------------------
    async def start(self):
        if self._task is None:
            interval = 5 if self.provider in ("fyers", "upstox", "angel") else 1.5
            self._task = asyncio.create_task(self._loop(interval))
        if self.provider == "public" and self._listener is None:
            self._listener = asyncio.create_task(self._listen_binance())
        if self.enable_us and self._stocks_task is None:
            self._stocks_task = asyncio.create_task(self._poll_us_stocks())
        if self.enable_india and self._india_task is None:
            self._india_task = asyncio.create_task(self._poll_india())

    async def stop(self):
        for task in (self._task, self._listener, self._stocks_task, self._india_task):
            if task:
                task.cancel()
        self._task = None
        self._listener = None
        self._stocks_task = None
        self._india_task = None

    async def add_client(self, ws):
        await ws.accept()
        self.clients.add(ws)
        await self._safe_send(ws, self.snapshot())

    def remove_client(self, ws):
        self.clients.discard(ws)

    # ----- broadcast loop --------------------------------------------------
    async def _loop(self, interval):
        while True:
            try:
                if self.provider == "demo":
                    self._tick_demo()
                elif self.provider in ("fyers", "upstox", "angel"):
                    await self._tick_real()
                # public: the Binance listener updates self.quotes; just broadcast
                await self._broadcast()
            except Exception as exc:
                print(f"[market_data] loop error: {exc}")
            await asyncio.sleep(interval)

    def _tick_demo(self):
        for inst in self.instruments:
            q = self.quotes[inst["symbol"]]
            drift = random.gauss(0, inst["base"] * 0.00035)
            ltp = max(inst["base"] * 0.9, min(inst["base"] * 1.1, q.ltp + drift))
            self.quotes[inst["symbol"]] = _build(
                inst, ltp, q.close, q.volume + random.randint(100, 5000)
            )

    # ----- REAL public feed: Binance WebSocket -----------------------------
    async def _listen_binance(self):
        url = binance.stream_url(self.instruments)
        by_key = {i["binance"]: i for i in self.instruments}
        print(f"[market_data] connecting to Binance public feed ({len(by_key)} symbols)")
        while True:
            try:
                async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                    print("[market_data] Binance feed connected")
                    async for raw in ws:
                        try:
                            payload = json.loads(raw)
                            data = payload.get("data", payload)
                            key = data.get("s", "").lower()
                            inst = by_key.get(key)
                            if not inst:
                                continue
                            ltp = float(data["c"])       # last price
                            close = float(data["o"])     # use open as reference close
                            self.quotes[inst["symbol"]] = _build(
                                inst, ltp, close,
                                volume=float(data.get("v", 0)),
                                open_=float(data["o"]),
                                high=float(data["h"]),
                                low=float(data["l"]),
                            )
                        except Exception:
                            continue
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                print(f"[market_data] Binance feed error: {exc}; reconnecting in 3s")
                await asyncio.sleep(3)

    # ----- REAL US stocks: Yahoo Finance (polled, no keys) ------------------
    async def _poll_us_stocks(self):
        """Poll Yahoo Finance every 30s for real NYSE/NASDAQ quotes."""
        while True:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    quotes = await yahoo.fetch_stock_quotes(client)
                for q in quotes:
                    inst = {
                        "symbol": q["symbol"], "name": q["name"],
                        "base": q["base"], "market": q["market"],
                    }
                    self.quotes[q["symbol"]] = _build(
                        inst, q["ltp"], q["close"], volume=q["volume"],
                        open_=q["open"], high=q["high"], low=q["low"],
                    )
                if quotes:
                    print(f"[market_data] updated {len(quotes)} US stock quotes")
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                print(f"[market_data] US stock poll error: {exc}")
            await asyncio.sleep(30)

    # ----- REAL Indian stocks: Yahoo Finance (polled, INR) ------------------
    async def _poll_india(self):
        """Poll Yahoo Finance every 30s for real NSE quotes (INR)."""
        while True:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    quotes = await yahoo.fetch_india_quotes(client)
                for q in quotes:
                    inst = {
                        "symbol": q["symbol"], "name": q["name"],
                        "base": q["base"], "market": "INDIA", "currency": "INR",
                    }
                    self.quotes[q["symbol"]] = _build(
                        inst, q["ltp"], q["close"], volume=q["volume"],
                        open_=q["open"], high=q["high"], low=q["low"],
                    )
                if quotes:
                    print(f"[market_data] updated {len(quotes)} India quotes")
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                print(f"[market_data] India poll error: {exc}")
            await asyncio.sleep(30)

    # ----- broker adapters -------------------------------------------------
    async def _tick_real(self):
        async with httpx.AsyncClient(timeout=10) as client:
            if self.provider == "fyers":
                await self._poll_fyers(client)
            elif self.provider == "upstox":
                await self._poll_upstox(client)
            elif self.provider == "angel":
                await self._poll_angel(client)

    async def _poll_fyers(self, client):
        symbols = ",".join(i["fyers"] for i in self.instruments)
        response = await client.post(
            "https://api.fyers.in/api/v3/quotes",
            json={"symbols": symbols},
            headers={"Authorization": self.fyers_token, "Content-Type": "application/json"},
        )
        data = response.json()
        for inst in self.instruments:
            d = (data.get("d") or {}).get(inst["fyers"])
            if d:
                self.quotes[inst["symbol"]] = _build(
                    inst, d.get("ltp", inst["base"]), d.get("c", inst["base"]), d.get("v", 0)
                )

    async def _poll_upstox(self, client):
        keys = ",".join(i["upstox"] for i in self.instruments)
        response = await client.get(
            "https://api.upstox.com/v2/market-quote/ltp",
            params={"symbol_key": keys},
            headers={"Authorization": f"Bearer {self.upstox_token}", "Accept": "*/*"},
        )
        data = response.json().get("data") or {}
        for inst in self.instruments:
            d = data.get(inst["upstox"])
            if d:
                self.quotes[inst["symbol"]] = _build(
                    inst, d.get("last_price", inst["base"]),
                    d.get("close_price", inst["base"]), d.get("volume", 0)
                )

    async def _poll_angel(self, client):
        response = await client.post(
            "https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/",
            json={
                "mode": "LTP", "pref": ["nse_index", "nse_eq"],
                "symbols": {
                    "nse_index": [i["angel"] for i in self.instruments if i["angel"].startswith("nse_index")],
                    "nse_eq": [i["angel"] for i in self.instruments if i["angel"].startswith("nse_eq")],
                },
            },
            headers={
                "Authorization": f"Bearer {self.angel_token}",
                "X-PrivateKey": self.angel_key,
                "Content-Type": "application/json", "Accept": "application/json",
            },
        )
        data = response.json().get("data") or {}
        for inst in self.instruments:
            d = data.get(inst["angel"], {}).get("ltp", {})
            if d:
                self.quotes[inst["symbol"]] = _build(
                    inst, d.get("ltp", inst["base"]), d.get("close", inst["base"])
                )

    # ----- streaming -------------------------------------------------------
    def snapshot(self):
        return {
            "provider": self.provider,
            "currency": self.currency,
            "live": self.provider == "public" or self.provider != "demo",
            "quotes": [asdict(q) for q in self.quotes.values()],
            "ts": int(time.time() * 1000),
        }

    async def _safe_send(self, ws, payload):
        try:
            await ws.send_json(payload)
        except Exception:
            pass

    async def _broadcast(self):
        payload = self.snapshot()
        for ws in list(self.clients):
            await self._safe_send(ws, payload)


class MarketDataService:
    """Application-facing façade over the engine (klines/depth/trades)."""

    def __init__(self, engine: MarketDataEngine, cache: MarketCache):
        self.engine = engine
        self.cache = cache

    @property
    def provider(self) -> str:
        return self.engine.provider

    def snapshot(self) -> dict:
        return self.engine.snapshot()

    async def start(self):
        await self.engine.start()

    async def stop(self):
        await self.engine.stop()

    async def add_client(self, ws):
        await self.engine.add_client(ws)

    def remove_client(self, ws):
        self.engine.remove_client(ws)

    # ---- cached REST operations -------------------------------------------
    async def klines(self, symbol: str, interval: str, limit: int):
        symbol = symbol.upper()
        limit = max(1, min(limit, 500))

        # US stocks and Indian stocks use Yahoo Finance; crypto uses Binance.
        if symbol in yahoo.STOCK_SYMBOLS:
            key = ("stock-klines", symbol, interval, limit)
            cached = self.cache.get(key)
            if cached is not None:
                return cached
            try:
                async with httpx.AsyncClient(timeout=12) as client:
                    candles = await yahoo.fetch_stock_candles(client, symbol, interval, limit)
                self.cache.set(key, candles)
                return candles
            except Exception as exc:
                raise MarketDataError(str(exc), status_code=502)

        # Indian display names like "RELIANCE (NSE)" or Yahoo .NS/.BO form.
        india_names = {yahoo._india_display(s["symbol"]) for s in yahoo.INDIA_STOCKS}
        if symbol in india_names or symbol in yahoo.INDIA_SYMBOLS:
            key = ("india-klines", symbol, interval, limit)
            cached = self.cache.get(key)
            if cached is not None:
                return cached
            try:
                async with httpx.AsyncClient(timeout=12) as client:
                    candles = await yahoo.fetch_india_candles(client, symbol, interval, limit)
                self.cache.set(key, candles)
                return candles
            except Exception as exc:
                raise MarketDataError(str(exc), status_code=502)

        if not binance.is_allowed(symbol):
            raise MarketDataError(f"Unsupported symbol: {symbol}", status_code=400)

        key = ("klines", symbol, interval, limit)
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                candles = await binance.fetch_klines(client, symbol, interval, limit)
            self.cache.set(key, candles)
            return candles
        except Exception as exc:
            raise MarketDataError(str(exc), status_code=502)

    async def depth(self, symbol: str, limit: int):
        symbol = symbol.upper()
        if not binance.is_allowed(symbol):
            raise MarketDataError(f"Unsupported symbol: {symbol}", status_code=400)
        limit = max(1, min(limit, 5000))

        key = ("depth", symbol, "", limit)
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                result = await binance.fetch_depth(client, symbol, limit)
            self.cache.set(key, result)
            return result
        except Exception as exc:
            raise MarketDataError(str(exc), status_code=502)

    async def trades(self, symbol: str, limit: int):
        symbol = symbol.upper()
        if not binance.is_allowed(symbol):
            raise MarketDataError(f"Unsupported symbol: {symbol}", status_code=400)
        limit = max(1, min(limit, 1000))

        key = ("trades", symbol, "", limit)
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                result = await binance.fetch_trades(client, symbol, limit)
            self.cache.set(key, result)
            return result
        except Exception as exc:
            raise MarketDataError(str(exc), status_code=502)


# Composition root for the market-data aggregate.
engine = MarketDataEngine(settings)
market_data_service = MarketDataService(
    engine=engine,
    cache=MarketCache(ttl_seconds=settings.cache_ttl_seconds),
)
