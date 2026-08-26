import pytest
from httpx import AsyncClient
from tests.conftest import EXTORSION_CAT_ID, ROBO_CAT_ID


@pytest.mark.asyncio
async def test_get_categories(client: AsyncClient):
    response = await client.get("/api/v1/categories/")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) == 2
    assert categories[0]["name"] == "Extorsión y Cobro de Cupos"
    assert categories[0]["applicable_type"] == "denuncia_anonima"


@pytest.mark.asyncio
async def test_create_anonymous_report_success(client: AsyncClient):
    payload = {
        "category_id": str(EXTORSION_CAT_ID),
        "description": "Sujetos en moto dejaron sobre con amenazas en el comercio de la av. Principal.",
        "followup_code": "987654",
        "priority": "urgente",
        "is_emergency": True,
        "address_reference": "Av. Principal 450, frente al mercado",
    }
    response = await client.post("/api/v1/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    # Criterio de aceptación: Solo devuelve public_code, status y created_at (CERO UUIDs expuestos)
    assert "public_code" in data
    assert data["public_code"].startswith("LT-")
    assert data["status"] == "pendiente"
    assert "id" not in data
    assert "report_id" not in data


@pytest.mark.asyncio
async def test_create_report_invalid_category(client: AsyncClient):
    payload = {
        "category_id": "99999999-9999-9999-9999-999999999999",
        "description": "Reporte de prueba con categoría inexistente.",
    }
    response = await client.post("/api/v1/reports", json=payload)
    assert response.status_code == 400
    assert "no válida" in response.json()["detail"]
