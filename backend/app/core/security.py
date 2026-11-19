"""Pure security primitives.

No database access and no FastAPI dependency. Callers (TokenService,
AuthService) inject secrets and TTLs explicitly.
"""
from datetime import datetime

import bcrypt
import jwt


def hash_password(pw: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    """Check a plain-text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(
    user_id: int,
    email: str,
    kind: str = "access",
    *,
    secret: str,
    algorithm: str,
    access_ttl,
    refresh_ttl,
) -> str:
    """Create a signed JWT (access or refresh)."""
    now = datetime.utcnow()
    ttl = access_ttl if kind == "access" else refresh_ttl
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": kind,
        "iat": now,
        "exp": now + ttl,
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_token(token: str, *, secret: str, algorithm: str):
    """Decode a JWT, returning its payload or None when invalid/expired."""
    try:
        return jwt.decode(token, secret, algorithms=[algorithm])
    except Exception:
        return None
