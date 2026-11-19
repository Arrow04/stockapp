"""Framework-agnostic domain errors.

The API layer maps these to HTTP responses via a single exception handler
registered in ``app.main``. ``response_key`` preserves the legacy response
bodies: ``{"detail": ...}`` for auth errors, ``{"error": ...}`` for market
errors.
"""


class DomainError(Exception):
    status_code = 400
    response_key = "detail"


class BadRequestError(DomainError):
    status_code = 400


class UnauthorizedError(DomainError):
    status_code = 401


class ForbiddenError(DomainError):
    status_code = 403


class MarketDataError(DomainError):
    """Market REST errors keep the original ``{"error": ...}`` shape."""

    response_key = "error"

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code
