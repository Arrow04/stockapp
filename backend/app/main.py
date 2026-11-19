"""Application factory: CORS, exception mapping, lifespan and routers."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
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


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        lifespan=lifespan,
    )
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
