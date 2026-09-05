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


@pytest.mark.asyncio
async def test_upload_empty_or_tiny_file_rejected(client: AsyncClient):
    """Archivos vacíos o < 100 bytes deben ser rechazados con 400."""
    create_res = await client.post(
        "/api/v1/reports",
        json={"category_id": str(EXTORSION_CAT_ID), "description": "Prueba archivo vacío"},
    )
    code = create_res.json()["public_code"]

    # Archivo de 10 bytes
    files = {"file": ("empty.jpg", b"demasiado", "image/jpeg")}
    res = await client.post(f"/api/v1/reports/{code}/media", files=files)
    assert res.status_code == 400
    assert "demasiado pequeño" in res.json()["detail"].lower() or "vacío" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_spoofed_mime_type_rejected(client: AsyncClient):
    """Archivo de texto/script renombrado a .jpg con Content-Type falso debe ser rechazado."""
    create_res = await client.post(
        "/api/v1/reports",
        json={"category_id": str(EXTORSION_CAT_ID), "description": "Prueba spoofing de tipo"},
    )
    code = create_res.json()["public_code"]

    fake_payload = b"#!/bin/bash\necho 'payload malicioso'\n" * 10
    files = {"file": ("script.jpg", fake_payload, "image/jpeg")}
    res = await client.post(f"/api/v1/reports/{code}/media", files=files)
    assert res.status_code == 400
    assert "firma mágica" in res.json()["detail"].lower() or "no reconocida" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_payload_too_large_rejected(client: AsyncClient):
    """Payload mayor al límite permitido (25MB) debe retornar HTTP 413."""
    create_res = await client.post(
        "/api/v1/reports",
        json={"category_id": str(EXTORSION_CAT_ID), "description": "Prueba payload grande"},
    )
    code = create_res.json()["public_code"]

    # Generar payload simulado superior a 25MB (25MB + 1KB)
    large_payload = b"\xff\xd8\xff" + b"0" * (25 * 1024 * 1024 + 1024)
    files = {"file": ("huge.jpg", large_payload, "image/jpeg")}
    res = await client.post(f"/api/v1/reports/{code}/media", files=files)
    assert res.status_code == 413
    assert "límite máximo" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_upload_decompression_bomb_dimension_rejected(client: AsyncClient):
    """Imágenes con dimensiones descomunales (bomba DoS > 8000px) son rechazadas por Pydantic."""
    from packages.shared.schemas.media_validator import MediaUploadPayload, InvalidMediaFormatError
    
    # Crear imagen en memoria con dimensiones que exceden el límite de 8000px
    bomb_img = Image.new("RGB", (8001, 100), color=(255, 0, 0))
    buf = io.BytesIO()
    bomb_img.save(buf, format="JPEG")
    bomb_bytes = buf.getvalue()

    with pytest.raises(InvalidMediaFormatError) as exc_info:
        MediaUploadPayload.validate_file(
            filename="bomb.jpg",
            content_type="image/jpeg",
            file_bytes=bomb_bytes,
        )

    assert "dimensiones no permitidas" in str(exc_info.value).lower()

