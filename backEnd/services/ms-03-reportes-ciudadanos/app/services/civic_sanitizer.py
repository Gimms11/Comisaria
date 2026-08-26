import io
from typing import Tuple
from PIL import Image, ImageOps


class CivicSanitizer:
    """Sanitizador EXIF para fotografías de reportes comunitarios y vecinales."""

    @staticmethod
    def sanitize_image(
        image_bytes: bytes, max_dimension: int = 1920, quality: int = 80
    ) -> Tuple[bytes, bytes, str, int]:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode != "RGB":
                img = img.convert("RGB")

            if max(img.width, img.height) > max_dimension:
                img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            # Imagen principal
            clean_buf = io.BytesIO()
            img.save(clean_buf, format="JPEG", quality=quality, optimize=True)
            clean_bytes = clean_buf.getvalue()

            # Miniatura para feed
            thumb_buf = io.BytesIO()
            thumb_img = img.copy()
            thumb_img.thumbnail((400, 300), Image.Resampling.LANCZOS)
            thumb_img.save(thumb_buf, format="JPEG", quality=70, optimize=True)
            thumb_bytes = thumb_buf.getvalue()

            return clean_bytes, thumb_bytes, "image/jpeg", len(clean_bytes)


civic_sanitizer = CivicSanitizer()
