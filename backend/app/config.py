"""Central configuration.

This is the ONLY module in the backend that reads environment variables or
loads the .env file. Every other layer receives settings from here.
"""
import os
from datetime import timedelta

from dotenv import load_dotenv

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_BACKEND_DIR, ".env"))


class Settings:
    """Application settings loaded once at import time from env / .env."""

    def __init__(self) -> None:
        # ---- application ----
        self.app_title = "SaaS Dashboard API"
        self.app_version = "1.0.0"
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))
        # Comma-separated origins, e.g. "https://app.client.com,https://client.com"
        raw_origins = os.getenv("CORS_ORIGINS", "")
        self.cors_origins = (
            [o.strip() for o in raw_origins.split(",") if o.strip()]
            if raw_origins
            else [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
            ]
        )

        # ---- database / authentication ----
        self.db_path = os.path.join(_BACKEND_DIR, "database.db")
        self.jwt_secret = os.getenv(
            "JWT_SECRET", "cyber-sentinel-change-this-secret-key-please-2026"
        )
        self.environment = os.getenv("ENVIRONMENT", "development").lower()
        self.is_production = self.environment in ("production", "prod")
        if self.is_production and self.jwt_secret.startswith("cyber-sentinel-change-this"):
            raise RuntimeError(
                "JWT_SECRET must be set to a strong secret in production (ENVIRONMENT=production)"
            )
        self.jwt_algorithm = "HS256"
        self.access_ttl = timedelta(
            minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        )
        self.refresh_ttl = timedelta(
            days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        )
        self.totp_issuer = "StockApp-CyberSentinel"
        self.admin_email = os.getenv("ADMIN_EMAIL", "admin@stockapp.com")
        self.admin_name = os.getenv("ADMIN_NAME", "Admin User")
        self.admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        # ---- market data ----
        self.market_data_provider = os.getenv("MARKET_DATA_PROVIDER", "demo").lower()
        self.india_only = self.market_data_provider == "india"
        self.enable_india = (
            self.india_only or os.getenv("ENABLE_INDIA", "true").lower() == "true"
        )
        self.enable_us = not self.india_only
        self.fyers_token = os.getenv("FYERS_ACCESS_TOKEN", "")
        self.upstox_token = os.getenv("UPSTOX_ACCESS_TOKEN", "")
        self.angel_token = os.getenv("ANGEL_ACCESS_TOKEN", "")
        self.angel_key = os.getenv("ANGEL_API_KEY", "")
        self.cache_ttl_seconds = float(os.getenv("CACHE_TTL_SECONDS", "5"))
        self.allowed_symbols = frozenset(
            {
                "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT",
                "XRPUSDT", "ADAUSDT", "DOGEUSDT",
            }
        )

    @property
    def provider(self) -> str:
        """Alias kept for the health endpoint / compatibility."""
        return self.market_data_provider


settings = Settings()
