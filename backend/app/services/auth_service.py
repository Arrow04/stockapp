"""Authentication orchestration: register, login, 2FA, user lookups.

Depends on a UserRepository, TokenService and TwoFactorService supplied via
constructor injection. Contains no FastAPI or sqlite code.
"""
from app.config import settings
from app.core import security
from app.core.errors import (
    BadRequestError,
    ForbiddenError,
    UnauthorizedError,
)
from app.repositories.user_repository import UserRepository
from app.services.token_service import TokenService
from app.services.two_factor_service import TwoFactorService


def public_user(user: dict) -> dict:
    """Project a stored user into the public response shape."""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "is_2fa_enabled": bool(user["is_2fa_enabled"]),
        "created_at": user["created_at"],
    }


class AuthService:
    def __init__(
        self,
        users: UserRepository,
        tokens: TokenService,
        totp: TwoFactorService,
    ):
        self.users = users
        self.tokens = tokens
        self.totp = totp

    # ---- bootstrap --------------------------------------------------------
    def initialize(self) -> None:
        """Create the auth table and seed the admin account if missing."""
        self.users.init_db(
            settings.admin_email,
            settings.admin_name,
            security.hash_password(settings.admin_password),
        )

    # ---- registration / login --------------------------------------------
    def register(self, email: str, name: str, password: str) -> dict:
        if len(password) < 6:
            raise BadRequestError("Password must be at least 6 characters")
        if self.users.get_by_email(email):
            raise BadRequestError("Email already registered")
        user = self.users.create_user(email, name, security.hash_password(password))
        return {
            "access_token": self.tokens.make_token(user["id"], user["email"]),
            "user": public_user(user),
        }

    def login(self, email: str, password: str, code=None) -> dict:
        user = self.users.get_by_email(email)
        if not user or not security.verify_password(password, user["password_hash"]):
            raise UnauthorizedError("Invalid email or password")
        if user["is_2fa_enabled"]:
            if not code:
                return {"requires_2fa": True, "message": "2FA code required"}
            if not self.totp.verify(user["totp_secret"], code):
                raise UnauthorizedError("Invalid 2FA code")
        self.users.update_last_login(user["id"])
        return {
            "access_token": self.tokens.make_token(user["id"], user["email"]),
            "refresh_token": self.tokens.make_token(user["id"], user["email"], "refresh"),
            "user": public_user(user),
        }

    def user_from_access_token(self, token: str) -> dict:
        """Resolve an access token to an active user (used by API deps)."""
        payload = self.tokens.decode(token)
        if not payload or payload.get("type") != "access":
            raise UnauthorizedError("Invalid token")
        try:
            uid = int(payload["sub"])
        except (KeyError, TypeError, ValueError):
            raise UnauthorizedError("Invalid token")
        user = self.users.get_by_id(uid)
        if not user or not user["is_active"]:
            raise UnauthorizedError("User not found")
        return user

    # ---- 2FA --------------------------------------------------------------
    def setup_2fa(self, user: dict) -> dict:
        secret = self.totp.generate_secret()
        uri = self.totp.provisioning_uri(user["email"], secret)
        return {"secret": secret, "uri": uri, "qr": self.totp.qr_data_uri(uri)}

    def enable_2fa(self, user: dict, secret: str, code: str) -> dict:
        if not self.totp.verify(secret, code):
            raise BadRequestError("Invalid verification code")
        self.users.set_2fa(user["id"], secret)
        return {
            "message": "2FA enabled",
            "backup_codes": self.totp.generate_backup_codes(),
        }

    def disable_2fa(self, user: dict, password: str) -> dict:
        if not security.verify_password(password, user["password_hash"]):
            raise UnauthorizedError("Incorrect password")
        self.users.disable_2fa(user["id"])
        return {"message": "2FA disabled"}

    # ---- admin ------------------------------------------------------------
    def list_users(self) -> list:
        return [public_user(user) for user in self.users.list_all()]

    def assert_admin(self, user: dict) -> None:
        if user["role"] != "admin":
            raise ForbiddenError("Admin only")


# Composition root for the auth aggregate (constructor injection).
auth_service = AuthService(
    users=UserRepository(settings.db_path),
    tokens=TokenService(
        settings.jwt_secret, settings.jwt_algorithm,
        settings.access_ttl, settings.refresh_ttl,
    ),
    totp=TwoFactorService(settings.totp_issuer),
)
