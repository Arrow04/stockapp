# Client Handover — StockApp

Everything required to deploy, verify, and hand StockApp over to the client.

## 1. What was delivered

- **Next.js 16** frontend (React 18 + TypeScript + Tailwind), App Router
- **FastAPI** backend with a layered enterprise architecture (MVC + services/repositories)
- **JWT auth + TOTP 2FA** (bcrypt hashing, access/refresh tokens, QR setup, backup codes)
- **125 NSE + BSE Indian stocks** with real ₹ INR prices from Yahoo Finance (no API key)
- **Live WebSocket** quotes, candlestick charts with 6 timeframes, market heatmap, watchlist
- **User management** (admin) and **per-user portfolios** with live P&L
- **CI** (GitHub Actions: compile, 6 backend tests, frontend typecheck + production build)
- **Docker Compose** for one-command deployment

Repository: https://github.com/Arrow04/stockapp

## 2. Pre-handover checklist (MUST DO)

- [ ] **Change the JWT secret**: set `JWT_SECRET=<long random string>` (e.g. `openssl rand -hex 32`).
- [ ] **Set `ENVIRONMENT=production`** — the backend then refuses to boot with the default secret.
- [ ] **Change admin credentials** on first boot: `ADMIN_EMAIL`, `ADMIN_PASSWORD` (defaults: `admin@stockapp.com` / `admin123`).
- [ ] **Set `CORS_ORIGINS`** to the client's real domain(s), comma-separated.
- [ ] **Persist the database** (bind-mount `database.db`) and configure scheduled backups, or migrate to PostgreSQL for multi-instance.
- [ ] **Terminate TLS** at a reverse proxy (Caddy/nginx) and keep port 8000 private.
- [ ] **Inform the client** that Yahoo Finance free data is ~15 minutes delayed — suitable for analytics, not live trading.

## 3. Verify the delivery

```bash
# Backend tests (offline, no external services needed)
cd backend
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests/ -q          # expect: 6 passed

# Frontend checks
cd frontend
npm ci
npx tsc --noEmit
npm run build                        # expect: compiled successfully
```

Or with Docker:

```bash
JWT_SECRET=<secret> ENVIRONMENT=production docker compose up -d --build
docker compose logs -f backend
# open http://localhost:3000
```

Smoke test in the browser:
1. Login with the admin account.
2. Confirm NSE/BSE quote feed shows live ₹ prices and the candlestick chart loads.
3. Settings → Security → enable 2FA with an authenticator app (QR shown).
4. Logout; log back in — 2FA code should now be required.

## 4. Support notes

- Architecture details: `ARCHITECTURE.md`
- Auth details: `backend/README_AUTH.md`
- Market data / adding companies: `backend/MARKET_DATA.md`
- Deployment: `DEPLOYMENT.md`
- CI: `README_CI.md`

## 5. Known limitations

- Yahoo Finance public data is delayed ~15 minutes during market hours. For live tick data, connect a SEBI-registered broker API (Fyers/Upstox/Angel) — the provider abstraction already supports these via `MARKET_DATA_PROVIDER`.
- SQLite is single-writer; use PostgreSQL for HA / multiple backend instances.
- The in-memory login rate limiter is per-process; use a Redis-backed limiter at the proxy for multi-instance production.

© 2026 Cyber Sentinel Technology — cybersentineltech.online
