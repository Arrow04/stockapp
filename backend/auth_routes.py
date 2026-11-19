"""Backwards-compatible import location for the auth router."""
from app.api.routes.auth import router
from app.models.schemas import Disable2FAIn, LoginIn, RegisterIn, TwoFAVerifyIn

__all__ = ["router", "RegisterIn", "LoginIn", "TwoFAVerifyIn", "Disable2FAIn"]
