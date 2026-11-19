# StockApp Deployment

Docker configuration for a quick local/demo deployment, plus production notes.
No application source code is changed by these files.

## Path A — Local / demo (Docker Compose)

Prerequisites: Docker Engine with the Compose plugin (`docker compose version`).

1. Optionally set a strong secret without editing any file:
   - PowerShell: `$env:JWT_SECRET = "a-long-random-secret"; docker compose up -d --build`
   - bash: `JWT_SECRET="a-long-random-secret" docker compose up -d --build`

   If unset, Compose falls back to `change-me-in-production`.

2. Build and start:

   ```
   docker compose up -d --build
   ```

3. Follow backend logs:

   ```
   docker compose logs -f backend
   ```

4. Open http://localhost:3000 (frontend) and http://localhost:8000 (API).

5. Stop with `docker compose down`.

Details / caveats:

- Backend builds from `backend/` (Python 3.11-slim) and runs `python main.py` on port 8000. Frontend builds from `frontend/` (Node 20 Alpine), runs `next build` during image build and `npm run start` on port 3000.
- `.dockerignore` files keep `venv/`, `.env`, `*.db`, `node_modules` and `.next` out of the build contexts. Since `.env` is excluded, all runtime settings come from the Compose `environment:` section.
- `CORS_ORIGINS` is read by `backend/app/config.py` (comma-separated). Compose sets `http://localhost:3000` by default; change it for a real domain (e.g. `https://app.client.com,https://client.com`).
- The SQLite path is hardcoded to `backend/database.db` inside the container. With no volume mounted, data resets when the container is replaced. To persist now, create the host file first and add a bind mount:
  ```
  # PowerShell: if (-not (Test-Path .\backend\database.db)) { New-Item -ItemType File .\backend\database.db }
  volumes:
    - ./backend/database.db:/app/database.db
  ```
  On Linux/macOS Docker creates a *directory* if the host path is missing — always create the empty file first. For multiple backend instances, migrate to PostgreSQL (`asyncpg` + `sqlalchemy` are already in requirements.txt) instead of sharing a SQLite file.

## Path B — Production (VPS / Hostinger)

- Set secrets through the environment/secrets manager; never commit them:
  - `JWT_SECRET` — long random string (e.g. `openssl rand -hex 32`).
  - `CORS_ORIGINS` — your real HTTPS origin (comma-separated if several). Read directly by config.py.
  - `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` — override the seeded admin account (defaults: admin@stockapp.com / admin123). The seed only creates the account if it doesn't exist, so set these on first boot.
  - `ENVIRONMENT=production` — makes the app REFUSE to start with the default JWT secret (fails fast rather than running insecurely).
  - Broker tokens (`FYERS_ACCESS_TOKEN`, `UPSTOX_ACCESS_TOKEN`, `ANGEL_ACCESS_TOKEN`, `ANGEL_API_KEY`) only if using a broker provider.
- Put a reverse proxy (Caddy or nginx) in front: TLS termination, HTTPS-only, proxy API paths to port 8000, and keep port 8000 off the public internet (`ports: ["127.0.0.1:8000:8000"]` when the proxy runs on the same host). Caddy can auto-provision Let's Encrypt certificates.
- Run containers as a non-root user (`user:` in Compose or a `USER` directive in the Dockerfile) and keep base images patched.
- Use PostgreSQL for multi-instance/high-availability deployments; SQLite is single-writer. Back up the database on a schedule (for SQLite, copy `database.db` while stopped or use SQLite's backup API) and test restores.
- Firewall: allow only 80/443 and SSH from your IP; do not publish container ports unnecessarily.
- Add rate limiting and, if appropriate, basic auth at the proxy (Caddy `rate_limit` / nginx `limit_req`).
- Market data: the free Yahoo Finance provider used by `MARKET_DATA_PROVIDER=india`/`public` is roughly 15 minutes delayed — not for live trading decisions.

## Client-delivery checklist

- [ ] Change default admin credentials via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env on first boot (or update the seeded row in the DB).
- [ ] Replace `change-me-in-production` with a strong `JWT_SECRET` and set `ENVIRONMENT=production` so a default secret refuses to boot.
- [ ] Verify CORS/origin settings for the client's domain.
- [ ] Confirm database persistence and backups are in place.
- [ ] Inform the client that Yahoo-sourced data is ~15 minutes delayed.
