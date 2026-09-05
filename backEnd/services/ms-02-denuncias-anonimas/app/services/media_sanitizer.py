import io
from typing import Optional, Tuple
from PIL import Image, ImageOps

# Prevención de ataques DoS por bombas de píxeles / descompresión
Image.MAX_IMAGE_PIXELS = 50_000_000


class MediaSanitizer:
    """
    Servicio de sanitización estricta de imágenes para eliminar metadatos EXIF,
    geolocalización GPS y huellas de cámara antes del almacenamiento.
    """

    @staticmethod
    def sanitize_image(
        image_bytes: bytes, max_dimension: int = 2048, quality: int = 85
    ) -> Tuple[bytes, bytes, str, int]:
        """
        Elimina metadatos EXIF, reorienta según orientación previa y genera imagen limpia + miniatura.
        
        Retorna:
            (clean_image_bytes, thumbnail_bytes, mime_type, file_size)
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                # 1. Transponer según orientación EXIF antes de despojar metadatos
                img = ImageOps.exif_transpose(img)


            # 2. Convertir a RGB si es necesario (manejar RGBA / CMYK)
            if img.mode in ("RGBA", "LA", "P"):
                # Preservar PNG o convertir a RGB con fondo blanco
                clean_format = "PNG"
                mime_type = "image/png"
            else:
                clean_format = "JPEG"
                mime_type = "image/jpeg"
                if img.mode != "RGB":
                    img = img.convert("RGB")

            # 3. Redimensionar si supera la dimensión máxima
            if max(img.width, img.height) > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            # 4. Guardar imagen principal limpia (SIN EXIF)
            clean_buffer = io.BytesIO()
            img.save(clean_buffer, format=clean_format, quality=quality, optimize=True)
            clean_bytes = clean_buffer.getvalue()

            # 5. Generar miniatura 300x300
            thumb_buffer = io.BytesIO()
            thumb_img = img.copy()
            thumb_img.thumbnail((300, 300), Image.Resampling.LANCZOS)
            thumb_img.save(thumb_buffer, format=clean_format, quality=75, optimize=True)
            thumb_bytes = thumb_buffer.getvalue()

            return clean_bytes, thumb_bytes, mime_type, len(clean_bytes)
        except Exception as exc:
            raise ValueError(f"Error sanitizando imagen: {str(exc)}")


media_sanitizer = MediaSanitizer()

