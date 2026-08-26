import logging
from typing import Optional
import boto3
from botocore.client import Config
from app.core.config import settings

logger = logging.getLogger("video_storage")


class VideoStorageClient:
    """Cliente de almacenamiento público para guías cívicas, videos y documentos descargables."""

    def __init__(self):
        self.bucket_name = settings.STORAGE_BUCKET
        self._s3_client = None
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
                logger.warning(f"No se pudo inicializar S3 en video storage: {e}")
        return self._s3_client

    async def upload_file(
        self, file_bytes: bytes, storage_path: str, mime_type: str = "application/octet-stream"
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
                return f"{settings.STORAGE_PUBLIC_URL}/{self.bucket_name}/{storage_path}"
            except Exception as e:
                logger.warning(f"S3 no accesible en video storage ({storage_path}): {e}")

        self._memory_storage[storage_path] = (file_bytes, mime_type)
        return f"{settings.STORAGE_PUBLIC_URL}/{self.bucket_name}/{storage_path}"


video_storage = VideoStorageClient()
