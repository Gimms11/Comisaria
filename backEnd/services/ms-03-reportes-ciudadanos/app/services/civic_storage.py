import logging
from typing import Optional
import boto3
from botocore.client import Config
from app.core.config import settings

logger = logging.getLogger("civic_storage")


class CivicStorageClient:
    """Cliente de almacenamiento para fotos de reportes urbanos y comunitarios."""

    def __init__(self):
        self.bucket_name = settings.STORAGE_BUCKET
        self._s3_client = None
        self._public_s3_client = None
        self._memory_storage = {}

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
                logger.warning(f"No se pudo inicializar S3 en civic storage: {e}")
        return self._s3_client

    @property
    def public_client(self):
        if self._public_s3_client is None and settings.STORAGE_ACCESS_KEY:
            endpoint = settings.STORAGE_PUBLIC_URL or settings.STORAGE_ENDPOINT
            try:
                self._public_s3_client = boto3.client(
                    "s3",
                    endpoint_url=endpoint,
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
                logger.warning(f"No se pudo inicializar cliente S3 público: {e}")
        return self._public_s3_client

    async def upload_bytes(
        self, file_bytes: bytes, storage_path: str, mime_type: str = "image/jpeg"
    ) -> str:
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
                logger.warning(f"S3 no accesible en civic storage ({storage_path}): {e}")

        self._memory_storage[storage_path] = (file_bytes, mime_type)
        return storage_path

    async def generate_url(self, storage_path: str) -> str:
        """Genera URL de lectura accesible para reportes comunitarios."""
        s3 = self.public_client or self.client
        if s3:
            try:
                url = s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket_name, "Key": storage_path},
                    ExpiresIn=settings.STORAGE_SIGNED_URL_EXPIRE_SECONDS,
                )
                return url
            except Exception:
                pass

        base = settings.STORAGE_PUBLIC_URL or "http://localhost:9000"
        return f"{base}/{self.bucket_name}/{storage_path}"


civic_storage = CivicStorageClient()
