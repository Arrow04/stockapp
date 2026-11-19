"""Pydantic schemas shared by the API layer.

Request models validate inbound bodies; response models document the shapes
returned by the services (routes return plain dicts to preserve the exact
legacy JSON structure).
"""
from pydantic import BaseModel


# ---- auth requests --------------------------------------------------------
class RegisterIn(BaseModel):
    email: str
    name: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str
    code: str | None = None  # 2FA code when required


class TwoFAVerifyIn(BaseModel):
    secret: str
    code: str


class Disable2FAIn(BaseModel):
    password: str


# ---- market / auth response schemas (documentation) ----------------------
class PublicUserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_2fa_enabled: bool
    created_at: str


class CandleOut(BaseModel):
    openTime: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class DepthOut(BaseModel):
    lastUpdateId: int
    bids: list[list[float]]
    asks: list[list[float]]


class TradeOut(BaseModel):
    price: float
    qty: float
    time: int
    isBuyerMaker: bool


class QuoteOut(BaseModel):
    symbol: str
    name: str
    ltp: float
    open: float
    high: float
    low: float
    close: float
    change: float
    change_pct: float
    volume: float
    ts: int
    market: str = "CRYPTO"
    currency: str = "USDT"


class SnapshotOut(BaseModel):
    provider: str
    currency: str
    live: bool
    quotes: list[QuoteOut]
    ts: int
