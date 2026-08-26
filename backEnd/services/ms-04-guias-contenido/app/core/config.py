from typing import Optional
from packages.shared.config import SharedSettings


class Settings(SharedSettings):
    SERVICE_NAME: str = "ms-04-guias-contenido"
    MS01_INTERNAL_URL: str = "http://ms-01-gateway-auth:8000"

    # Storage S3 / MinIO / GCS
    STORAGE_ENDPOINT: Optional[str] = "http://minio:9000"
    STORAGE_ACCESS_KEY: Optional[str] = "minioadmin"
    STORAGE_SECRET_KEY: Optional[str] = "minioadmin123"
    STORAGE_BUCKET: str = "comisaria-guias-videos"
    STORAGE_PUBLIC_URL: Optional[str] = "http://localhost:9000"


settings = Settings()
