FROM python:3.12-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev libjpeg62-turbo-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/ms-03-reportes-ciudadanos/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Dev ──
FROM base AS dev
COPY packages/ /app/packages/
COPY services/ms-03-reportes-ciudadanos/app/ /app/app/
ENV PYTHONPATH=/app:/app/packages
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app/app"]

# ── Prod ──
FROM base AS prod
COPY packages/ /app/packages/
COPY services/ms-03-reportes-ciudadanos/app/ /app/app/
ENV PYTHONPATH=/app:/app/packages
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8080 8000
CMD ["sh", "-c", "exec gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8080} --forwarded-allow-ips='*' --workers 1 --threads 8 --timeout 300"]


