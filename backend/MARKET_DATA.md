# Indian Market Data (NSE + BSE)

The app is configured **India-first**: real Indian equity data in ₹ INR.

## Current setup

`backend/.env`:
```
MARKET_DATA_PROVIDER=india
```

This serves **125 NSE + BSE listed companies** via the Yahoo Finance public
chart API (no API key, no account required), refreshed every 30 seconds and
streamed to the frontend over WebSocket `/ws/market-data`.

- **NSE**: NIFTY 50, NIFTY Bank + 100+ listed companies (Reliance, TCS, HDFC, Infosys, SBIN, ...)
- **BSE**: 18 listed companies (Reliance, TCS, HDFC, ...)
- Prices in **INR** (₹)

## Data flow

```
Yahoo Finance chart API (free, no key)
   └─ poll 125 NSE/BSE symbols every 30s (concurrency 3)
        └─ FastAPI engine -> WebSocket /ws/market-data -> Next.js dashboard
             └─ REST fallback: /api/quotes
             └─ Candles: /api/klines?symbol=RELIANCE (NSE)&interval=1m&limit=60
```

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/quotes` | 125 Indian quotes snapshot |
| `GET /api/klines?symbol=<name>&interval=1m&limit=60` | OHLC candles (1m/5m/15m/1h/4h/1d) |
| `GET /health` | Shows `provider: india` |

## Adding more companies

Edit `INDIA_STOCKS` in `backend/us_stocks.py`. Add a tuple with the Yahoo
symbol (`.NS` for NSE, `.BO` for BSE), display name, market, and sector:

```python
{"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "base": 950.0, "market": "NSE", "sector": "Auto"},
```

Restart the backend. The display symbol is generated automatically
(e.g. `RELIANCE.NS` -> `RELIANCE (NSE)`, `RELIANCE.BO` -> `RELIANCE (BSE)`).

## Going global later

The engine also supports (for a future global launch):
- `MARKET_DATA_PROVIDER=public` -> Binance crypto + US stocks + India
- Broker modes: `fyers`, `upstox`, `angel` (need account + token)

When ready, switch the env var and restart — the frontend auto-formats
currency per symbol (₹ for India, $ for US/crypto).

## Notes

- Yahoo Finance data for Indian equities is delayed ~15 min during market hours
  (free public endpoint). Good for dashboards/analytics, not for live trading.
- For tick-by-tick live trading data, connect a SEBI-registered broker API
  (Fyers/Upstox/Angel) with credentials.
