# Backend Architecture

The backend follows an enterprise layered architecture (MVC + services +
repositories, SOLID). Every existing endpoint and response shape is preserved.

## Entry point

- `main.py` — thin launcher: imports `app` from `app.main` and runs uvicorn.
- `app/main.py` — `create_app()` factory: CORS, lifespan (auth DB init +
  market engine start/stop), one domain-error handler, all routers.

## Layers and dependency rules

Dependencies point **inwards** only. Outer layers may import inner ones;
inner layers must never import outer ones.

```
api (routes + deps)  ->  services  ->  repositories  ->  core
        |                    |              |
        +-----> models <-----+              +-- (pure primitives)
        |
   config (settings, imported by all layers)
        |
   data (Yahoo / Binance adapters, used by services)
```

- **api/** — thin controllers under `api/routes/`. They validate inputs with
  Pydantic (`models/schemas.py`), call exactly one service method and return
  its result. No business logic, no sqlite, no HTTP status juggling.
  `api/deps.py` holds `get_current_user` / `get_admin_user`.
- **services/** — all business logic (`auth_service`, `token_service`,
  `two_factor_service`, `market_data_service`). Services receive their
  collaborators via constructor injection (DIP) and never import FastAPI.
- **repositories/** — the **only** place that touches sqlite3:
  `user_repository.py` (auth_users table) and `market_cache.py` (TTL cache).
- **core/** — framework-free primitives: `security.py` (bcrypt/JWT, no DB or
  FastAPI) and `errors.py` (domain errors mapped to HTTP in `app/main.py`).
- **models/** — Pydantic request/response schemas.
- **data/** — third-party adapters: `yahoo.py` (125 NSE/BSE stocks, INR) and
  `binance.py` (crypto REST/WS helpers for future global mode).
- **config.py** — the **single** source of environment configuration
  (`.env` loading, secrets, DB path, TTLs, provider, CORS, allow-list).

## Errors

Services raise `core.errors.DomainError` subclasses. A single handler in
`app/main.py` maps them to the legacy bodies: `{"detail": ...}` for auth
(400/401/403) and `{"error": ...}` for market endpoints (400/502).

## Compatibility

The legacy top-level modules `auth.py`, `auth_routes.py`, `market_data.py` and
`us_stocks.py` are thin re-export shims so old imports keep working; they
contain no logic. `database.db`, `.env`, `requirements.txt`, `MARKET_DATA.md`
and `README_AUTH.md` are untouched.
