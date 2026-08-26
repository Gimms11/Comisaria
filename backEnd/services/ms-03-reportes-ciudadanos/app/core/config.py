from typing import Optional
from packages.shared.config import SharedSettings


class Settings(SharedSettings):
    SERVICE_NAME: str = "ms-03-reportes-ciudadanos"
    MS01_INTERNAL_URL: str = "http://ms-01-gateway-auth:8000"

    # Storage S3 / MinIO / GCS
    STORAGE_ENDPOINT: Optional[str] = "http://minio:9000"
    STORAGE_ACCESS_KEY: Optional[str] = "minioadmin"
    STORAGE_SECRET_KEY: Optional[str] = "minioadmin123"
    STORAGE_BUCKET: str = "comisaria-reportes-urbanos"
    STORAGE_PUBLIC_URL: Optional[str] = "http://localhost:9000"
    STORAGE_SIGNED_URL_EXPIRE_SECONDS: int = 86400  # 24 horas para contenido cívico público


settings = Settings()
