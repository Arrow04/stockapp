# StockApp — Enterprise SaaS Trading Dashboard

A production-style, full-stack trading dashboard built with **Next.js**, **FastAPI**, and real **NSE/BSE Indian market data** (Yahoo Finance public API). Features JWT authentication with TOTP 2FA, per-user portfolios, real-time WebSocket streaming, candlestick charts, and a clean layered architecture.

Built by **Cyber Sentinel Technology** — [cybersentineltech.online](https://www.cybersentineltech.online/)

---

## ✨ Features

- 📈 **125 NSE + BSE companies** with real ₹ INR prices (no API key required)
- ⚡ **Real-time streaming** over WebSocket, with REST fallback
- 📊 **Candlestick charts** with 6 timeframes, volume, crosshair
- 📚 **Order book & market depth** and time-&-sales (crypto mode)
- 🔐 **Real auth**: bcrypt hashing, JWT access/refresh tokens, **TOTP 2FA** with QR setup
- 👥 **User management** (admin) with roles, and **per-user portfolios** with add/edit/delete
- 🎨 **Modern, responsive UI** — Tailwind CSS, dark sidebar, data-dense views
- 🏗️ **Enterprise architecture** — MVC + Services/Repositories (backend), MVVM (frontend)

---

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design. At a glance:

```
stockapp/
├── backend/                 # FastAPI (Python)
│   ├── main.py              # Thin entry point
│   └── app/
│       ├── main.py          # App factory, CORS, lifespan
│       ├── config.py        # Env configuration
│       ├── api/             # Controllers (thin) + auth dependencies
│       ├── core/            # Pure security primitives, errors
│       ├── models/          # Pydantic schemas
│       ├── repositories/    # All database access
│       ├── services/        # Business logic
│       └── data/            # Yahoo / Binance adapters
├── frontend/                # Next.js 16 (React + TypeScript)
│   └── src/
│       ├── models/          # Domain types (M)
│       ├── lib/             # Services (S)
│       ├── hooks/           # ViewModels (VM)
│       ├── components/      # Views (V)
│       └── app/             # Pages / screens
└── ARCHITECTURE.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env      # then edit JWT_SECRET!
python main.py            # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```

Open `http://localhost:3000`.

### Default credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@stockapp.com` | `admin123` | admin |

⚠️ **Change the JWT secret and default password before any real deployment.**

---

## 🔌 API overview

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health + active provider |
| `GET /api/quotes` | 125 Indian quotes snapshot |
| `GET /api/klines?symbol=RELIANCE (NSE)&interval=1m&limit=60` | OHLC candles |
| `WS /ws/market-data` | Live quote stream |
| `POST /api/auth/register` | Register |
| `POST /api/auth/login` | Login (returns `requires_2fa` when enabled) |
| `GET /api/auth/me` | Current user |
| `POST /api/auth/2fa/setup` | QR + secret |
| `POST /api/auth/2fa/enable` | Enable 2FA |
| `POST /api/auth/2fa/disable` | Disable 2FA |
| `GET /api/auth/users` | User list (admin) |

Full auth docs: [`backend/README_AUTH.md`](./backend/README_AUTH.md) · Market data docs: [`backend/MARKET_DATA.md`](./backend/MARKET_DATA.md)

---

## ⚙️ Configuration

All configuration is via `backend/.env` (see [`backend/.env.example`](./backend/.env.example)):

- `MARKET_DATA_PROVIDER=india` — India-only mode (default). Other modes: `public`, `demo`, `fyers`, `upstox`, `angel`.
- `JWT_SECRET` — **change this**.
- `HOST` / `PORT` — server bind (defaults `0.0.0.0:8000`).

---

## 📝 Notes

- Yahoo Finance's free public endpoint is **delayed ~15 minutes** during market hours — suitable for dashboards and analytics, not for live order execution.
- For tick-by-tick live data, connect a SEBI-registered broker API (Fyers / Upstox / Angel) by setting the corresponding provider and credentials.
- This project is provided as-is for demonstration and development.

© 2026 Cyber Sentinel Technology.
