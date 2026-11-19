"""JWT creation/decoding wrapper.

Injects configuration into the pure primitives in ``core.security``.
"""
from app.core import security


class TokenService:
    def __init__(self, secret: str, algorithm: str, access_ttl, refresh_ttl):
        self.secret = secret
        self.algorithm = algorithm
        self.access_ttl = access_ttl
        self.refresh_ttl = refresh_ttl

    def make_token(self, user_id: int, email: str, kind: str = "access") -> str:
        return security.make_token(
            user_id, email, kind,
            secret=self.secret,
            algorithm=self.algorithm,
            access_ttl=self.access_ttl,
            refresh_ttl=self.refresh_ttl,
        )

    def decode(self, token: str):
        return security.decode_token(
            token, secret=self.secret, algorithm=self.algorithm
        )
