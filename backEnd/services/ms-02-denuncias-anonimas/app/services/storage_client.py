import io
import logging
from typing import Optional
import boto3
from botocore.client import Config
from app.core.config import settings

logger = logging.getLogger("storage_client")


class StorageClient:
    """
    Cliente de almacenamiento de objetos compatible con S3 (MinIO en local / GCS en prod).
    """

    def __init__(self):
        self.bucket_name = settings.STORAGE_BUCKET
        self._s3_client = None
        self._memory_storage = {}  # Fallback en memoria para tests

    @property
    def client(self):
        if self._s3_client is None and settings.STORAGE_ACCESS_KEY and settings.STORAGE_ENDPOINT:
            try:
                self._s3_client = boto3.client(
                    "s3",
                    endpoint_url=settings.STORAGE_ENDPOINT,
                    aws_access_key_id=settings.STORAGE_ACCESS_KEY,
                    aws_secret_access_key=settings.STORAGE_SECRET_KEY,
                    config=Config(
                        signature_version="s3v4",
                        connect_timeout=1,
                        read_timeout=1,
                        retries={"max_attempts": 1},
                    ),
                    region_name="us-central1",
                )
            except Exception as e:
                logger.warning(f"No se pudo inicializar cliente S3: {e}")
        return self._s3_client

    async def upload_bytes(
        self,
        file_bytes: bytes,
        storage_path: str,
        mime_type: str = "application/octet-stream",
    ) -> str:
        """Sube un archivo binario al bucket."""
        s3 = self.client
        if s3:
            try:
                s3.put_object(
                    Bucket=self.bucket_name,
                    Key=storage_path,
                    Body=file_bytes,
                    ContentType=mime_type,
                )
                return storage_path
            except Exception as e:
                logger.warning(f"S3 no accesible ({storage_path}), usando memoria local: {e}")

        # Fallback en memoria
        self._memory_storage[storage_path] = (file_bytes, mime_type)
        return storage_path

    async def generate_signed_url(
        self, storage_path: str, expires_in: Optional[int] = None
    ) -> str:
        """Genera una URL firmada V4 con expiración temporal (15 min por defecto)."""
        ttl = expires_in or settings.STORAGE_SIGNED_URL_EXPIRE_SECONDS
        s3 = self.client
        if s3:
            try:
                url = s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket_name, "Key": storage_path},
                    ExpiresIn=ttl,
                )
                return url
            except Exception as e:
                logger.warning(f"Error generando URL firmada para {storage_path}: {e}")

        # Fallback URL simulada
        return f"http://localhost:9000/{self.bucket_name}/{storage_path}?token=mock_signed_url_ttl_{ttl}"


storage_client = StorageClient()
