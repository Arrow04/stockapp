# Enterprise Architecture — StockApp

StockApp is built as a layered, maintainable application following **MVC**, **MVVM**, and **SOLID** principles. This document describes the architecture, layer boundaries, and dependency rules.

---

## 1. Architectural Style

| Layer | Backend (Python / FastAPI) | Frontend (Next.js / React) |
|-------|----------------------------|----------------------------|
| **Presentation** | `app/api/routes/*` (controllers) | `app/*` (pages) + `components/*` (views) |
| **ViewModel** | — | `hooks/*` (presentation state & logic) |
| **Application / Service** | `app/services/*` | `lib/*` (API clients / services) |
| **Domain / Model** | `app/models/*` (Pydantic schemas) | `models/*` (domain types) |
| **Data / Repository** | `app/repositories/*` | (localStorage repositories in `lib/*`) |
| **Infrastructure** | `app/core/*`, `app/data/*`, `app/config.py` | Next.js runtime / fetch |

---

## 2. Backend — Layered MVC (+ Services & Repositories)

```
backend/
  main.py                 THIN entry point (imports app, runs uvicorn)
  app/
    main.py               create_app() factory, CORS, lifespan, router registration
    config.py             Env-driven Settings (single source of truth)
    api/
      deps.py             Auth dependencies (get_current_user, get_admin_user)
      routes/
        health.py         GET /health, GET /
        auth.py           POST /api/auth/*  (thin controllers)
        market.py         /api/klines, /api/depth, /api/trades, /ws/market-data
    core/
      security.py         Pure primitives: hashing, JWT encode/decode (no DB, no FastAPI)
    models/
      schemas.py          Pydantic request/response contracts
    repositories/
      user_repository.py  ALL sqlite access for auth_users
      market_cache.py     TTL cache abstraction
    services/
      auth_service.py     Registration / login orchestration
      token_service.py    JWT wrapper (uses config)
      two_factor_service.py  TOTP, QR, backup codes
      market_data_service.py Engine wrapper, snapshots, candles
    data/
      yahoo.py            Yahoo Finance India adapter (NSE + BSE)
      binance.py          Binance adapter (future global mode)
```

### Dependency rule (SOLID / clean architecture)

```
controllers  ->  services  ->  repositories  ->  database
     |              |
     +------------> models/schemas
```

- **Controllers are thin**: validate with Pydantic, call one service, return result.
- **Services hold business logic** and never import FastAPI.
- **Repositories own all persistence**; no other layer touches `sqlite3`.
- **core/security** is pure — no DB, no framework.
- **config.py** is the only module reading environment variables.

### SOLID mapping
- **S**ingle Responsibility — each service/repository has one job.
- **O**pen/Closed — new market data providers are added in `data/` without changing controllers.
- **L**iskov — provider adapters expose the same interface (`fetch_quotes`, `fetch_candles`).
- **I**nterface Segregation — controllers depend on narrow service functions, not a god object.
- **D**ependency Inversion — services receive repositories via constructor injection.

---

## 3. Frontend — MVVM

```
frontend/src/
  models/        Model         Domain types (Quote, AuthUser, Holding, AppUser, ...)
  lib/           Service       API clients (authApi), persistence repositories
  hooks/         ViewModel     useMarketData, useAuth, usePortfolio, useUsers
  components/    View          Presentational + smart components
  app/           View          Next.js App Router pages (screens)
```

### Data flow

```
User interacts with View (component / page)
        -> ViewModel (hook) calls Service (lib)
        -> Service calls FastAPI REST / WebSocket
        -> ViewModel updates state
        -> View re-renders
```

- **Models** are pure types — no logic, no framework.
- **Services** (`lib/`) are the only layer that knows HTTP endpoints or localStorage keys.
- **ViewModels** (`hooks/`) own UI state, fetching, validation, and side effects.
- **Views** (`components/`, `app/`) render data and emit events; they do not call APIs directly.
- Domain types are re-exported from their original modules for backward compatibility while new code imports from `@/models`.

---

## 4. Cross-cutting concerns

- **Authentication**: bcrypt hashing, JWT access + refresh tokens, TOTP 2FA with QR setup. Protected routes use `useRequireAuth()` (frontend) and `get_current_user` (backend).
- **Configuration**: all env vars live in `backend/.env` (see `.env.example`). Never commit secrets.
- **Error handling**: services raise typed errors; controllers translate to HTTP status codes; views surface user-friendly messages.
- **Real-time data**: WebSocket `/ws/market-data` streams standardized quotes; REST fallback via `/api/quotes`.

---

## 5. Extension points

| Need | Where to change |
|------|-----------------|
| Add an Indian company | `backend/app/data/yahoo.py` `INDIA_STOCKS` |
| Add a new market provider | New adapter in `backend/app/data/`, register in market service |
| Add an API endpoint | New thin controller in `backend/app/api/routes/`, call a service |
| Add a dashboard widget | New component in `frontend/src/components/`, use a hook for data |
| Change auth rules | `backend/app/services/auth_service.py` |
