"""Reusable FastAPI dependencies for authentication/authorization."""
from fastapi import Depends, Header

from app.core.errors import ForbiddenError, UnauthorizedError
from app.services.auth_service import auth_service


def get_current_user(authorization: str | None = Header(None)) -> dict:
    """Resolve the Bearer token into the current user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Not authenticated")
    return auth_service.user_from_access_token(authorization.split(" ", 1)[1])


def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    """Require an authenticated user with the admin role."""
    auth_service.assert_admin(user)
    return user
