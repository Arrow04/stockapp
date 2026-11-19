"""Portfolio business logic (no FastAPI / no DB details)."""
from app.repositories.portfolio_repository import PortfolioRepository

DEFAULT_HOLDINGS = [
    {"symbol": "RELIANCE (NSE)", "qty": 10, "avgPrice": 1320},
    {"symbol": "TCS (NSE)", "qty": 5, "avgPrice": 2320},
    {"symbol": "HDFCBANK (NSE)", "qty": 20, "avgPrice": 790},
    {"symbol": "INFY (NSE)", "qty": 15, "avgPrice": 1150},
]


class PortfolioService:
    def __init__(self, repo: PortfolioRepository):
        self.repo = repo

    def initialize(self, email: str):
        self.repo.seed_for(email, DEFAULT_HOLDINGS)

    def list(self, email: str):
        return self.repo.list_for(email)

    def add(self, email: str, symbol: str, qty: float, avg_price: float):
        if qty <= 0 or avg_price <= 0:
            raise ValueError("Quantity and average price must be positive")
        self.repo.add(email, symbol, qty, avg_price)
        return self.list(email)

    def update(self, email: str, hid: int, qty: float, avg_price: float):
        if qty <= 0 or avg_price <= 0:
            raise ValueError("Quantity and average price must be positive")
        self.repo.update(email, hid, qty, avg_price)
        return self.list(email)

    def delete(self, email: str, hid: int):
        self.repo.delete(email, hid)
        return self.list(email)


# Singleton used by the API router and the app lifespan.
from app.config import settings
portfolio_service_holder = PortfolioService(PortfolioRepository(settings.database_url))
