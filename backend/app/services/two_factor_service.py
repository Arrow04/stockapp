"""TOTP 2FA logic: secrets, provisioning URIs, QR codes, backup codes."""
import base64
import io
import secrets

import pyotp
import qrcode


class TwoFactorService:
    def __init__(self, issuer_name: str = "StockApp-CyberSentinel"):
        self.issuer_name = issuer_name

    def generate_secret(self) -> str:
        return pyotp.random_base32()

    def provisioning_uri(self, email: str, secret: str) -> str:
        return pyotp.TOTP(secret).provisioning_uri(
            name=email, issuer_name=self.issuer_name
        )

    def qr_data_uri(self, uri: str) -> str:
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    def verify(self, secret: str, code: str) -> bool:
        try:
            return pyotp.TOTP(secret).verify(str(code).strip(), valid_window=1)
        except Exception:
            return False

    def generate_backup_codes(self):
        return [secrets.token_hex(3).upper() for _ in range(8)]
