import io
from typing import Optional
try:
    from PIL import Image
    # Prevenir DoS por bombas de descompresión (Zip/Decompression bomb)
    Image.MAX_IMAGE_PIXELS = 50_000_000
except ImportError:
    Image = None

from pydantic import BaseModel, ValidationError, model_validator


MIN_FILE_SIZE_BYTES = 100
MAX_IMAGE_DIMENSION = 8000


class PayloadTooLargeError(ValueError):
    """Error cuando el archivo excede el tamaño máximo permitido."""
    pass


class InvalidMediaFormatError(ValueError):
    """Error cuando la firma mágica o integridad estructural no corresponde a una imagen válida."""
    pass


class MediaUploadPayload(BaseModel):
    """
    Validador Pydantic V2 para uploads de archivos multimedia.
    Verifica:
      1. Rango de tamaño (no vacío y <= límite máximo de bytes).
      2. Magic numbers reales (JPEG, PNG, WebP) independientemente de extensión o Content-Type declarado.
      3. Integridad profunda con Pillow (img.verify).
      4. Dimensiones límite para evitar ataques de descompresión de memoria en Cloud Run.
    """
    filename: str
    content_type: str
    file_bytes: bytes
    max_size_bytes: int = 25 * 1024 * 1024
    detected_mime_type: Optional[str] = None
    detected_format: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

    @model_validator(mode="after")
    def validate_payload_and_real_content(self) -> "MediaUploadPayload":
        size = len(self.file_bytes)
        if size < MIN_FILE_SIZE_BYTES:
            raise InvalidMediaFormatError(
                f"El archivo es demasiado pequeño o está vacío ({size} bytes). Mínimo requerido: {MIN_FILE_SIZE_BYTES} bytes."
            )
        if size > self.max_size_bytes:
            max_mb = self.max_size_bytes // (1024 * 1024)
            raise PayloadTooLargeError(
                f"El archivo supera el límite máximo permitido de {max_mb}MB ({size} bytes recibidos)."
            )

        data = self.file_bytes
        real_mime = None
        if data.startswith(b"\xff\xd8\xff"):
            real_mime = "image/jpeg"
        elif data.startswith(b"\x89PNG\r\n\x1a\n"):
            real_mime = "image/png"
        elif data.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"WEBP":
            real_mime = "image/webp"
        else:
            raise InvalidMediaFormatError(
                "Firma mágica de archivo no reconocida. Solo se permiten imágenes JPEG, PNG o WebP auténticas."
            )

        # Inspección de integridad estructural con Pillow
        try:
            with Image.open(io.BytesIO(data)) as img:
                img_format = img.format.upper() if img.format else ""
                expected_format = {
                    "image/jpeg": "JPEG",
                    "image/png": "PNG",
                    "image/webp": "WEBP",
                }.get(real_mime)

                if img_format != expected_format:
                    raise InvalidMediaFormatError(
                        f"Inconsistencia de formato: cabecera mágica indica {real_mime} pero estructura interna es {img_format}."
                    )

                w, h = img.size
                if w <= 0 or h <= 0 or w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
                    raise InvalidMediaFormatError(
                        f"Dimensiones no permitidas: {w}x{h} px (máximo permitido: {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION} px)."
                    )

                img.verify()
                self.width = w
                self.height = h
                self.detected_mime_type = real_mime
                self.detected_format = img_format
        except (PayloadTooLargeError, InvalidMediaFormatError):
            raise
        except Exception as exc:
            raise InvalidMediaFormatError(f"Archivo de imagen corrupto o inválido: {str(exc)}")

        return self

    @classmethod
    def validate_file(
        cls,
        filename: str,
        content_type: str,
        file_bytes: bytes,
        max_size_bytes: int = 25 * 1024 * 1024,
    ) -> "MediaUploadPayload":
        """
        Método de fábrica que ejecuta la validación del modelo Pydantic
        y desempaqueta ValidationError en excepciones específicas de dominio.
        """
        try:
            return cls(
                filename=filename,
                content_type=content_type,
                file_bytes=file_bytes,
                max_size_bytes=max_size_bytes,
            )
        except ValidationError as exc:
            for err in exc.errors():
                msg = err.get("msg", "")
                if msg.startswith("Value error, "):
                    msg = msg[len("Value error, "):]
                if "supera el límite" in msg.lower():
                    raise PayloadTooLargeError(msg) from exc
                else:
                    raise InvalidMediaFormatError(msg) from exc
            raise InvalidMediaFormatError(str(exc)) from exc

