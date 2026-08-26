import pytest
from httpx import AsyncClient
from tests.conftest import PREVENCION_CAT_ID


@pytest.mark.asyncio
async def test_admin_create_and_publish_flow(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Crear borrador de guía
    payload = {
        "category_id": str(PREVENCION_CAT_ID),
        "title": "Evita caer en préstamos gota a gota",
        "summary": "Recomendaciones clave de seguridad para comerciantes y vecinos.",
        "content_type": "video",
        "main_video_url": "https://storage.googleapis.com/tinguina/gota_a_gota.mp4",
        "duration_seconds": 60,
        "is_featured": False,
        "is_published": False,
    }
    create_res = await client.post("/api/v1/admin/guides/", json=payload, headers=headers)
    assert create_res.status_code == 201
    guide_id = create_res.json()["id"]

    # 2. Verificar que NO aparece en el feed público
    public_res = await client.get("/api/v1/guides/")
    slugs = [g["slug"] for g in public_res.json()]
    assert "evita-caer-en-prestamos-gota-a-gota" not in slugs

    # 3. Subir recurso multimedia / infografía
    data = {
        "title": "Infografía Prevención Gota a Gota",
        "resource_type": "imagen",
        "media_url": "https://storage.googleapis.com/tinguina/infografia.png",
    }
    upload_res = await client.post(
        f"/api/v1/admin/guides/{guide_id}/resources",
        json=data,
        headers=headers,
    )
    assert upload_res.status_code == 201
    assert upload_res.json()["title"] == "Infografía Prevención Gota a Gota"

    # 4. Publicar la guía
    publish_res = await client.patch(
        f"/api/v1/admin/guides/{guide_id}/publish",
        json={"is_published": True},
        headers=headers,
    )
    assert publish_res.status_code == 200
    assert publish_res.json()["is_published"] is True

    # 5. Verificar que AHORA SÍ aparece en el feed público
    public_after = await client.get("/api/v1/guides/")
    new_slugs = [g["slug"] for g in public_after.json()]
    assert "evita-caer-en-prestamos-gota-a-gota" in new_slugs
