import io
from PIL import Image
import pytest
from httpx import AsyncClient
from app.services.media_sanitizer import media_sanitizer
from tests.conftest import EXTORSION_CAT_ID


def create_dummy_image_bytes() -> bytes:
    """Crea una imagen JPEG válida en memoria con datos simulados."""
    img = Image.new("RGB", (800, 600), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_media_sanitizer_direct():
    raw_bytes = create_dummy_image_bytes()
    clean_bytes, thumb_bytes, mime_type, size = media_sanitizer.sanitize_image(raw_bytes)

    assert len(clean_bytes) > 0
    assert len(thumb_bytes) > 0
    assert mime_type == "image/jpeg"

    # Verificar que la imagen limpia puede abrirse y no tiene etiquetas EXIF
    with Image.open(io.BytesIO(clean_bytes)) as clean_img:
        assert clean_img.format == "JPEG"
        exif_data = clean_img.getexif()
        assert len(exif_data) == 0

    # Verificar miniatura
    with Image.open(io.BytesIO(thumb_bytes)) as thumb_img:
        assert thumb_img.width <= 300
        assert thumb_img.height <= 300


@pytest.mark.asyncio
async def test_upload_report_media_endpoint(client: AsyncClient):
    # 1. Crear denuncia
    create_res = await client.post(
        "/api/v1/reports",
        json={
            "category_id": str(EXTORSION_CAT_ID),
            "description": "Denuncia con fotografía de la nota extorsiva dejada.",
        },
    )
    public_code = create_res.json()["public_code"]

    # 2. Subir imagen
    dummy_image = create_dummy_image_bytes()
    files = {"file": ("nota_evidencia.jpg", dummy_image, "image/jpeg")}
    upload_res = await client.post(f"/api/v1/reports/{public_code}/media", files=files)

    assert upload_res.status_code == 201
    media_data = upload_res.json()
    assert media_data["status"] == "uploaded"
    assert media_data["media_type"] == "foto"
    assert "storage_path" in media_data
    assert "thumbnail_path" in media_data
