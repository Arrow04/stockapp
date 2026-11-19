"""Application factory: CORS, exception mapping, lifespan and routers."""
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth as auth_routes
from app.api.routes import health as health_routes
from app.api.routes import market as market_routes
from app.config import settings
from app.core.errors import DomainError
from app.services.auth_service import auth_service
from app.services.market_data_service import market_data_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialise persistence and start the market feed.
    auth_service.initialize()
    await market_data_service.start()
    try:
        yield
    finally:
        await market_data_service.stop()


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Map domain errors to the legacy JSON error bodies."""
    return JSONResponse(
        status_code=exc.status_code,
        content={exc.response_key: str(exc)},
    )


# Lightweight in-memory brute-force protection for login/register.
# For multi-instance production, replace with Redis-backed rate limiting.
_login_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_WINDOW = 60          # seconds
_RATE_MAX = 10             # attempts per window per IP


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/api/auth/login", "/api/auth/register"):
            ip = _client_ip(request)
            now = time.time()
            attempts = [t for t in _login_attempts[ip] if now - t < _RATE_WINDOW]
            if len(attempts) >= _RATE_MAX:
                return JSONResponse(status_code=429, content={"detail": "Too many attempts. Try again later."})
            attempts.append(now)
            _login_attempts[ip] = attempts
        return await call_next(request)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        lifespan=lifespan,
    )
    app.add_middleware(LoginRateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(DomainError, domain_error_handler)
    app.include_router(health_routes.router)
    app.include_router(auth_routes.router)
    app.include_router(market_routes.router)
    return app


app = create_app()
