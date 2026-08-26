import pytest
from httpx import AsyncClient
from tests.conftest import ROBO_CAT_ID


@pytest.mark.asyncio
async def test_citizen_status_tracking_with_pin(client: AsyncClient):
    # 1. Crear denuncia con PIN
    create_res = await client.post(
        "/api/v1/reports",
        json={
            "category_id": str(ROBO_CAT_ID),
            "description": "Robaron mototaxi azul en esquina San Martín.",
            "followup_code": "123456",
        },
    )
    public_code = create_res.json()["public_code"]

    # 2. Consultar sin PIN -> Descripción protegida
    unverified_res = await client.get(f"/api/v1/reports/{public_code}/status")
    assert unverified_res.status_code == 200
    unverified_data = unverified_res.json()
    assert unverified_data["is_verified"] is False
    assert "protegida" in unverified_data["description"]

    # 3. Consultar con PIN incorrecto -> Descripción protegida
    bad_pin_res = await client.get(
        f"/api/v1/reports/{public_code}/status?followup_code=999999"
    )
    assert bad_pin_res.status_code == 200
    assert bad_pin_res.json()["is_verified"] is False

    # 4. Consultar con PIN correcto -> Descripción visible
    verified_res = await client.get(
        f"/api/v1/reports/{public_code}/status?followup_code=123456"
    )
    assert verified_res.status_code == 200
    verified_data = verified_res.json()
    assert verified_data["is_verified"] is True
    assert verified_data["description"] == "Robaron mototaxi azul en esquina San Martín."


@pytest.mark.asyncio
async def test_police_management_workflow(client: AsyncClient, police_auth_token: str):
    headers = {"Authorization": f"Bearer {police_auth_token}"}

    # 1. Crear denuncia ciudadana
    create_res = await client.post(
        "/api/v1/reports",
        json={
            "category_id": str(ROBO_CAT_ID),
            "description": "Denuncia para seguimiento policial.",
            "priority": "alta",
        },
    )
    public_code = create_res.json()["public_code"]

    # 2. Policía lista denuncias
    list_res = await client.get("/api/v1/police/reports/", headers=headers)
    assert list_res.status_code == 200
    reports = list_res.json()
    assert len(reports) >= 1
    report_id = reports[0]["id"]

    # 3. Policía ve detalle completo
    detail_res = await client.get(f"/api/v1/police/reports/{report_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["public_code"] == public_code
    assert detail["status"] == "pendiente"

    # 4. Policía actualiza estado a 'en_revision'
    update_res = await client.patch(
        f"/api/v1/police/reports/{report_id}/status",
        json={"new_status": "en_revision", "note": "Patrullaje asignado al cuadrante 3"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["new_status"] == "en_revision"

    # 5. Agregar nota interna
    note_res = await client.post(
        f"/api/v1/police/reports/{report_id}/notes",
        json={"internal_note": "Sospechoso identificado con alias El Chato"},
        headers=headers,
    )
    assert note_res.status_code == 200

    # 6. Verificar que el ciudadano ve el nuevo estado
    citizen_status = await client.get(f"/api/v1/reports/{public_code}/status")
    assert citizen_status.json()["status"] == "en_revision"
