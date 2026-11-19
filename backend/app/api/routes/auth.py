"""Authentication controllers: /api/auth/*."""
from fastapi import APIRouter, Depends

from app.api.deps import get_admin_user, get_current_user
from app.models.schemas import (
    Disable2FAIn,
    LoginIn,
    RegisterIn,
    TwoFAVerifyIn,
)
from app.services.auth_service import auth_service, public_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
def register(body: RegisterIn):
    return auth_service.register(body.email, body.name, body.password)


@router.post("/login")
def login(body: LoginIn):
    return auth_service.login(body.email, body.password, body.code)


@router.get("/me")
def me(user=Depends(get_current_user)):
    return public_user(user)


@router.post("/2fa/setup")
def setup_2fa(user=Depends(get_current_user)):
    return auth_service.setup_2fa(user)


@router.post("/2fa/enable")
def enable_2fa(body: TwoFAVerifyIn, user=Depends(get_current_user)):
    return auth_service.enable_2fa(user, body.secret, body.code)


@router.post("/2fa/disable")
def disable_2fa(body: Disable2FAIn, user=Depends(get_current_user)):
    return auth_service.disable_2fa(user, body.password)


@router.get("/users")
def list_users(user=Depends(get_admin_user)):
    return auth_service.list_users()
