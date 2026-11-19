FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# .dockerignore excludes venv/, *.db and .env — only real source is copied.
COPY . .

EXPOSE 8000

# Settings (JWT_SECRET, MARKET_DATA_PROVIDER, HOST, PORT, ...) are supplied
# at runtime by docker-compose's `environment:` section (no .env in image).
CMD ["python", "main.py"]
