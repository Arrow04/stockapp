"""Offline smoke tests for the StockApp API using FastAPI's TestClient."""
import os
import sys
import uuid

# Make the backend package importable when tests are run from
# D:\stockapp\backend (or from any other working directory).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pyotp
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import auth_service

# One unique identity per test run keeps these tests repeatable against the
# (gitignored) local SQLite database.
EMAIL = f"smoke-{uuid.uuid4().hex}@example.com"
NAME = "Smoke Test User"
PASSWORD = "SmokeTest123!"


@pytest.fixture(scope="module")
def client():
    """Seed the auth DB without starting the app lifespan.

    Running the lifespan would launch background market-feed tasks that poll
    Yahoo/Binance. The endpoints exercised here only need the auth tables and
    the seeded admin account, so we initialise those directly and use an
    in-process TestClient (no real network calls, no port 8000 dependency).
    """
    auth_service.initialize()
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "provider" in payload


def test_quotes_shape(client):
    response = client.get("/api/quotes")
    assert response.status_code == 200
    payload = response.json()
    assert "provider" in payload
    assert "currency" in payload
    assert isinstance(payload["quotes"], list)
    for quote in payload["quotes"]:
        assert "symbol" in quote
        assert "ltp" in quote
        assert "change_pct" in quote


def test_register_login_me_2fa_flow(client):
    # Register -> access token.
    response = client.post(
        "/api/auth/register",
        json={"email": EMAIL, "name": NAME, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    assert token

    # Authenticated /me returns the same email.
    response = client.get("/api/auth/me", headers=_bearer(token))
    assert response.status_code == 200, response.text
    assert response.json()["email"] == EMAIL

    # Login before 2FA -> access token.
    response = client.post(
        "/api/auth/login", json={"email": EMAIL, "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    assert response.json()["access_token"]

    # 2FA setup returns a QR image and a shared secret.
    response = client.post("/api/auth/2fa/setup", headers=_bearer(token))
    assert response.status_code == 200, response.text
    setup = response.json()
    assert "qr" in setup
    assert "secret" in setup
    secret = setup["secret"]

    # Enable 2FA with a fresh TOTP code for that secret.
    response = client.post(
        "/api/auth/2fa/enable",
        headers=_bearer(token),
        json={"secret": secret, "code": pyotp.TOTP(secret).now()},
    )
    assert response.status_code == 200, response.text

    # Login without a code now requires 2FA.
    response = client.post(
        "/api/auth/login", json={"email": EMAIL, "password": PASSWORD}
    )
    assert response.status_code == 200, response.text
    assert response.json().get("requires_2fa") is True

    # Login with a valid code succeeds.
    response = client.post(
        "/api/auth/login",
        json={
            "email": EMAIL,
            "password": PASSWORD,
            "code": pyotp.TOTP(secret).now(),
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["access_token"]


def test_wrong_password(client):
    response = client.post(
        "/api/auth/login", json={"email": EMAIL, "password": "definitely-wrong"}
    )
    assert response.status_code == 401


def test_admin_seed(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@stockapp.com", "password": "admin123"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["user"]["role"] == "admin"


def test_protected_me_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
