import pytest
from httpx import AsyncClient


async def get_token_for(client: AsyncClient, email: str, password: str) -> str:
    res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_list_officers_rbac(client: AsyncClient):
    admin_token = await get_token_for(client, "admin@tinguina.pnp.gob.pe", "AdminPass2026!")
    operador_token = await get_token_for(client, "operador@tinguina.pnp.gob.pe", "OperadorPass2026!")

    # Admin puede listar
    admin_res = await client.get(
        "/api/v1/officers/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_res.status_code == 200
    officers = admin_res.json()
    assert len(officers) >= 2

    # Operador NO puede listar (403 Forbidden)
    operador_res = await client.get(
        "/api/v1/officers/",
        headers={"Authorization": f"Bearer {operador_token}"},
    )
    assert operador_res.status_code == 403


@pytest.mark.asyncio
async def test_create_officer_success_and_conflict(client: AsyncClient):
    admin_token = await get_token_for(client, "admin@tinguina.pnp.gob.pe", "AdminPass2026!")

    # 1. Crear nuevo oficial
    new_officer_data = {
        "full_name": "Teniente Juan Perez",
        "email": "jperez@tinguina.pnp.gob.pe",
        "password": "TenienteSecure2026!",
        "role": "comisario",
    }
    create_res = await client.post(
        "/api/v1/officers/",
        json=new_officer_data,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["email"] == "jperez@tinguina.pnp.gob.pe"
    assert created["role"] == "comisario"
    assert "id" in created

    # 2. Intentar crear duplicado (409 Conflict)
    duplicate_res = await client.post(
        "/api/v1/officers/",
        json=new_officer_data,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert duplicate_res.status_code == 409


@pytest.mark.asyncio
async def test_update_officer(client: AsyncClient):
    admin_token = await get_token_for(client, "admin@tinguina.pnp.gob.pe", "AdminPass2026!")

    # 1. Crear oficial
    create_res = await client.post(
        "/api/v1/officers/",
        json={
            "full_name": "Suboficial Carlos Ramos",
            "email": "cramos@tinguina.pnp.gob.pe",
            "password": "RamosPass2026!",
            "role": "operador",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    officer_id = create_res.json()["id"]

    # 2. Actualizar rol a moderador
    update_res = await client.patch(
        f"/api/v1/officers/{officer_id}",
        json={"role": "moderador", "full_name": "Suboficial Mayor Carlos Ramos"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["role"] == "moderador"
    assert updated["full_name"] == "Suboficial Mayor Carlos Ramos"


@pytest.mark.asyncio
async def test_change_own_password(client: AsyncClient):
    operador_token = await get_token_for(client, "operador@tinguina.pnp.gob.pe", "OperadorPass2026!")

    # 1. Intentar cambiar con contraseña actual errónea (400)
    bad_res = await client.patch(
        "/api/v1/officers/me/password",
        json={"current_password": "WrongPassword!", "new_password": "NewOperadorPass2026!"},
        headers={"Authorization": f"Bearer {operador_token}"},
    )
    assert bad_res.status_code == 400

    # 2. Cambiar exitosamente
    ok_res = await client.patch(
        "/api/v1/officers/me/password",
        json={"current_password": "OperadorPass2026!", "new_password": "NewOperadorPass2026!"},
        headers={"Authorization": f"Bearer {operador_token}"},
    )
    assert ok_res.status_code == 200

    # 3. Validar login con la nueva contraseña
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "operador@tinguina.pnp.gob.pe", "password": "NewOperadorPass2026!"},
    )
    assert new_login.status_code == 200
