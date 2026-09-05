import io
import pytest
from PIL import Image
from httpx import AsyncClient
from tests.conftest import ALUMBRADO_CAT_ID, BACHES_CAT_ID
from packages.shared.schemas.media_validator import MediaUploadPayload, PayloadTooLargeError


def generate_valid_photo(color=(70, 180, 90), width=640, height=480) -> bytes:
    """Genera imagen JPEG válida en memoria."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_mobile_flow_community_report_e2e(client: AsyncClient):
    """
    Flujo Móvil de Reportes Ciudadanos Comunitarios:
    1. Cargar categorías cívicas (/api/v1/categories/).
    2. Crear reporte vecinal de luminaria dañada con coordenadas.
    3. Adjuntar fotografía sanitizada con comprobación de tipo real Pydantic.
    4. Compartir tarjeta ciudadana (incremento de métrica).
    5. Consultar vista OpenGraph para compartir en WhatsApp.
    """
    # 1. Categorías cívicas
    cats_res = await client.get("/api/v1/categories/")
    assert cats_res.status_code == 200
    cats = cats_res.json()
    assert len(cats) >= 2

    # 2. Crear reporte
    payload = {
        "category_id": str(ALUMBRADO_CAT_ID),
        "description": "Poste de alumbrado público parpadea y cables expuestos en Parque Las Palmeras.",
        "latitude": -14.0381,
        "longitude": -75.7299,
        "reference": "Frente al monumento central",
    }
    create_res = await client.post("/api/v1/community-reports", json=payload)
    assert create_res.status_code == 201
    rep_data = create_res.json()
    public_code = rep_data["public_code"]
    assert public_code.startswith("LT-")

    # 3. Subir fotografía válida
    photo_bytes = generate_valid_photo()
    files = {"file": ("poste_danado.jpg", photo_bytes, "image/jpeg")}
    upload_res = await client.post(f"/api/v1/community-reports/{public_code}/media", files=files)
    assert upload_res.status_code == 201
    media_res = upload_res.json()
    assert media_res["status"] == "uploaded"
    assert media_res["size_bytes"] > 0

    # 4. Incrementar métrica de difusión comunitaria
    share_res = await client.post(
        f"/api/v1/community-reports/{public_code}/share",
        json={"platform": "whatsapp"},
    )
    assert share_res.status_code == 200
    assert share_res.json()["shares_count"] >= 1

    # 5. OpenGraph preview
    og_res = await client.get(f"/api/v1/community/p/{public_code}")
    assert og_res.status_code == 200
    assert "og:title" in og_res.text


@pytest.mark.asyncio
async def test_community_upload_payload_and_sanitization_limits(client: AsyncClient):
    """Pruebas de límite de payload y sanitización en reportes comunitarios."""
    # 1. Crear reporte base
    create_res = await client.post(
        "/api/v1/community-reports",
        json={"category_id": str(BACHES_CAT_ID), "description": "Bache gigante en Av. Los Molles"},
    )
    code = create_res.json()["public_code"]

    # Caso 1: Archivo vacío (<100B) -> 400
    res_empty = await client.post(
        f"/api/v1/community-reports/{code}/media",
        files={"file": ("vacio.jpg", b"12345", "image/jpeg")},
    )
    assert res_empty.status_code == 400
    assert "demasiado pequeño" in res_empty.json()["detail"].lower() or "vacío" in res_empty.json()["detail"].lower()

    # Caso 2: Spoofed extension (script renombrado a .jpg) -> 400
    res_spoof = await client.post(
        f"/api/v1/community-reports/{code}/media",
        files={"file": ("fake.jpg", b"echo 'malicious script'\n" * 10, "image/jpeg")},
    )
    assert res_spoof.status_code == 400
    assert "firma mágica" in res_spoof.json()["detail"].lower() or "no reconocida" in res_spoof.json()["detail"].lower()

    # Caso 3: Supera límite de tamaño -> PayloadTooLargeError
    with pytest.raises(PayloadTooLargeError):
        MediaUploadPayload.validate_file(
            filename="huge.jpg",
            content_type="image/jpeg",
            file_bytes=b"\xff\xd8\xff" + b"A" * 2000,
            max_size_bytes=1000,
        )
