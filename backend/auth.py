"""Backwards-compatible facade over the layered auth implementation.

New code should import from ``app.services.auth_service``,
``app.core.security`` and ``app.repositories.user_repository`` instead.
"""
from app.config import settings
from app.core import security
from app.core.security import hash_password, verify_password
from app.services.auth_service import auth_service, public_user
from app.services.two_factor_service import TwoFactorService

DB_PATH = settings.db_path
SECRET = settings.jwt_secret
ALGO = settings.jwt_algorithm
ACCESS_TTL = settings.access_ttl
REFRESH_TTL = settings.refresh_ttl


def init_auth_db():
    auth_service.initialize()


def make_token(user_id: int, email: str, kind: str = "access") -> str:
    return auth_service.tokens.make_token(user_id, email, kind)


def decode_token(token: str):
    return auth_service.tokens.decode(token)


def get_by_email(email: str):
    return auth_service.users.get_by_email(email)


def get_by_id(uid: int):
    return auth_service.users.get_by_id(uid)


def create_user(email: str, name: str, password: str, role: str = "user"):
    return auth_service.users.create_user(
        email, name, security.hash_password(password), role
    )


def update_last_login(uid: int):
    auth_service.users.update_last_login(uid)


def generate_totp_secret() -> str:
    return auth_service.totp.generate_secret()


def totp_uri(email: str, secret: str) -> str:
    return auth_service.totp.provisioning_uri(email, secret)


def qr_data_uri(uri: str) -> str:
    return auth_service.totp.qr_data_uri(uri)


def verify_totp(secret: str, code: str) -> bool:
    return auth_service.totp.verify(secret, code)


def enable_2fa(uid: int, secret: str):
    auth_service.users.set_2fa(uid, secret)


def disable_2fa(uid: int):
    auth_service.users.disable_2fa(uid)


def generate_backup_codes():
    return auth_service.totp.generate_backup_codes()


__all__ = [
    "DB_PATH", "SECRET", "ALGO", "ACCESS_TTL", "REFRESH_TTL",
    "init_auth_db", "hash_password", "verify_password", "make_token",
    "decode_token", "get_by_email", "get_by_id", "create_user",
    "update_last_login", "public_user", "generate_totp_secret", "totp_uri",
    "qr_data_uri", "verify_totp", "enable_2fa", "disable_2fa",
    "generate_backup_codes", "TwoFactorService",
]
