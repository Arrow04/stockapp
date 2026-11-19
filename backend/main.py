"""Thin entry point. The application is built by ``app.main.create_app``."""
from app.main import app

if __name__ == "__main__":
    import uvicorn

    from app.config import settings

    uvicorn.run(app, host=settings.host, port=settings.port, access_log=False)
