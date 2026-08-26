from typing import Optional
from packages.shared.config import SharedSettings


class Settings(SharedSettings):
    SERVICE_NAME: str = "ms-02-denuncias-anonimas"
    MS01_INTERNAL_URL: str = "http://ms-01-gateway-auth:8000"

    # Storage S3 / MinIO / GCS
    STORAGE_ENDPOINT: Optional[str] = "http://minio:9000"
    STORAGE_ACCESS_KEY: Optional[str] = "minioadmin"
    STORAGE_SECRET_KEY: Optional[str] = "minioadmin123"
    STORAGE_BUCKET: str = "comisaria-evidencias-delitos"
    STORAGE_PUBLIC_URL: Optional[str] = "http://localhost:9000"
    STORAGE_SIGNED_URL_EXPIRE_SECONDS: int = 900  # 15 minutos


settings = Settings()
