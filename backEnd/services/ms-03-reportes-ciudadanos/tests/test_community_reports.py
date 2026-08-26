import io
from PIL import Image
import pytest
from httpx import AsyncClient
from tests.conftest import ALUMBRADO_CAT_ID, BACHES_CAT_ID


def create_dummy_civic_image() -> bytes:
    img = Image.new("RGB", (640, 480), color=(120, 180, 90))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_get_community_categories(client: AsyncClient):
    response = await client.get("/api/v1/categories/")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) == 2
    assert categories[0]["applicable_type"] == "reporte_comunitario"


@pytest.mark.asyncio
async def test_create_and_view_community_report(client: AsyncClient):
    # 1. Crear reporte cívico
    payload = {
        "category_id": str(ALUMBRADO_CAT_ID),
        "description": "Poste de luz sin foco desde hace dos semanas en Parque Central.",
        "priority": "media",
        "address_reference": "Parque Central, frente a la iglesia",
        "latitude": -14.032100,
        "longitude": -75.728900,
    }
    create_res = await client.post("/api/v1/community-reports", json=payload)
    assert create_res.status_code == 201
    public_code = create_res.json()["public_code"]

    # 2. Subir foto
    img_bytes = create_dummy_civic_image()
    files = {"file": ("poste.jpg", img_bytes, "image/jpeg")}
    media_res = await client.post(f"/api/v1/community-reports/{public_code}/media", files=files)
    assert media_res.status_code == 201
    assert media_res.json()["status"] == "uploaded"

    # 3. Listar reportes públicos
    list_res = await client.get("/api/v1/community-reports")
    assert list_res.status_code == 200
    reports = list_res.json()
    assert len(reports) == 1
    assert reports[0]["public_code"] == public_code
    assert reports[0]["image_url"] is not None

    # 4. Ver detalle público
    detail_res = await client.get(f"/api/v1/community-reports/{public_code}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["public_code"] == public_code
    assert len(detail["media_urls"]) == 1

    # 5. Ver página de OpenGraph preview para WhatsApp
    og_res = await client.get(f"/community/p/{public_code}")
    assert og_res.status_code == 200
    html_text = og_res.text
    assert 'property="og:title"' in html_text
    assert public_code in html_text
