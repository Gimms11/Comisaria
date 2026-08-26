import pytest
from httpx import AsyncClient
from tests.conftest import BACHES_CAT_ID


@pytest.mark.asyncio
async def test_share_metric_increment(client: AsyncClient):
    # 1. Crear reporte
    create_res = await client.post(
        "/api/v1/community-reports",
        json={
            "category_id": str(BACHES_CAT_ID),
            "description": "Gran bache en cruce de calle Lima con Arequipa.",
        },
    )
    public_code = create_res.json()["public_code"]

    # 2. Registrar difusión a WhatsApp
    share_res1 = await client.post(
        f"/api/v1/community-reports/{public_code}/share",
        json={"platform": "whatsapp"},
    )
    assert share_res1.status_code == 200
    assert share_res1.json()["shares_count"] == 1

    # 3. Registrar difusión a Facebook
    share_res2 = await client.post(
        f"/api/v1/community-reports/{public_code}/share",
        json={"platform": "facebook"},
    )
    assert share_res2.status_code == 200
    assert share_res2.json()["shares_count"] == 2

    # 4. Verificar en el detalle público que shares_count es 2
    detail_res = await client.get(f"/api/v1/community-reports/{public_code}")
    assert detail_res.json()["shares_count"] == 2


@pytest.mark.asyncio
async def test_police_derivation_workflow(client: AsyncClient, police_token: str):
    headers = {"Authorization": f"Bearer {police_token}"}

    # 1. Crear reporte
    create_res = await client.post(
        "/api/v1/community-reports",
        json={
            "category_id": str(BACHES_CAT_ID),
            "description": "Fuga de agua potable inundando pista.",
        },
    )
    public_code = create_res.json()["public_code"]

    # 2. Bandeja policial
    list_res = await client.get("/api/v1/police/community-reports/", headers=headers)
    assert list_res.status_code == 200
    reports = list_res.json()
    report_id = reports[0]["id"]

    # 3. Derivar reporte a Serenazgo / Municipalidad
    update_res = await client.patch(
        f"/api/v1/police/community-reports/{report_id}/status",
        json={
            "new_status": "derivado",
            "note": "Derivado a Gerencia de Obras y Serenazgo Municipal mediante Oficio N° 45-2026",
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["new_status"] == "derivado"

    # 4. Ciudadano verifica estado y nota de constancia
    detail_res = await client.get(f"/api/v1/community-reports/{public_code}")
    detail = detail_res.json()
    assert detail["status"] == "derivado"
    assert len(detail["status_history"]) == 1
    assert "Obras y Serenazgo" in detail["status_history"][0]["note"]
