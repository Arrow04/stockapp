"""Persistence for per-user portfolio holdings (PostgreSQL / SQLite)."""
from sqlalchemy import (
    Column, Integer, String, Numeric, Table, MetaData, insert, select, update, delete
)
from sqlalchemy.engine import Engine
from sqlalchemy import create_engine


class PortfolioRepository:
    def __init__(self, database_url: str):
        self.engine: Engine = create_engine(
            database_url,
            future=True,
            connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
        )
        self.metadata = MetaData()
        self.holdings = Table(
            "portfolio_holdings", self.metadata,
            Column("id", Integer, primary_key=True, autoincrement=True),
            Column("email", String(255), nullable=False, index=True),
            Column("symbol", String(64), nullable=False),
            Column("qty", Numeric(20, 6), nullable=False),
            Column("avg_price", Numeric(20, 6), nullable=False),
        )
        self.metadata.create_all(self.engine)

    def list_for(self, email: str):
        with self.engine.begin() as conn:
            rows = conn.execute(
                select(self.holdings).where(self.holdings.c.email == email.lower())
            ).fetchall()
            return [
                {"id": r.id, "symbol": r.symbol, "qty": float(r.qty), "avgPrice": float(r.avg_price)}
                for r in rows
            ]

    def add(self, email: str, symbol: str, qty: float, avg_price: float):
        with self.engine.begin() as conn:
            result = conn.execute(
                insert(self.holdings).values(
                    email=email.lower(), symbol=symbol, qty=qty, avg_price=avg_price
                )
            )
            return result.inserted_primary_key[0]

    def update(self, email: str, hid: int, qty: float, avg_price: float):
        with self.engine.begin() as conn:
            conn.execute(
                update(self.holdings)
                .where(self.holdings.c.id == hid, self.holdings.c.email == email.lower())
                .values(qty=qty, avg_price=avg_price)
            )

    def delete(self, email: str, hid: int):
        with self.engine.begin() as conn:
            conn.execute(
                delete(self.holdings).where(
                    self.holdings.c.id == hid, self.holdings.c.email == email.lower()
                )
            )

    def seed_for(self, email: str, rows: list[dict]):
        """Seed defaults only if this user has no holdings yet."""
        if self.list_for(email):
            return
        with self.engine.begin() as conn:
            for r in rows:
                conn.execute(
                    insert(self.holdings).values(
                        email=email.lower(), symbol=r["symbol"],
                        qty=r["qty"], avg_price=r["avgPrice"]
                    )
                )
