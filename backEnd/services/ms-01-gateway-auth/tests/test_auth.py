import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoints(client: AsyncClient):
    response_health = await client.get("/healthz")
    assert response_health.status_code == 200
    assert response_health.json()["status"] == "ok"

    response_ready = await client.get("/readyz")
    assert response_ready.status_code == 200
    assert response_ready.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@tinguina.pnp.gob.pe", "password": "AdminPass2026!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 900


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    # Contraseña incorrecta
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@tinguina.pnp.gob.pe", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "incorrectos" in response.json()["detail"]

    # Usuario inexistente
    response_not_found = await client.post(
        "/api/v1/auth/login",
        json={"email": "noexiste@tinguina.pnp.gob.pe", "password": "AnyPassword!"},
    )
    assert response_not_found.status_code == 401


@pytest.mark.asyncio
async def test_profile_me_endpoint(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@tinguina.pnp.gob.pe", "password": "AdminPass2026!"},
    )
    access_token = login_res.json()["access_token"]

    # 2. GET /me autenticado
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "admin@tinguina.pnp.gob.pe"
    assert profile["role"] == "admin"
    assert profile["full_name"] == "Comisario Mayor Admin"

    # 3. GET /me sin token
    unauth_res = await client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "operador@tinguina.pnp.gob.pe", "password": "OperadorPass2026!"},
    )
    refresh_token = login_res.json()["refresh_token"]

    # 2. Renovar token
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens

    # 3. Token de refresco falso
    invalid_refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "token.falso.invalido"},
    )
    assert invalid_refresh.status_code == 401


@pytest.mark.asyncio
async def test_ws_ticket_generation(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@tinguina.pnp.gob.pe", "password": "AdminPass2026!"},
    )
    access_token = login_res.json()["access_token"]

    # 2. Solicitar ticket efímero
    ticket_res = await client.post(
        "/api/v1/auth/ws-ticket",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert ticket_res.status_code == 200
    ticket_data = ticket_res.json()
    assert "ticket" in ticket_data
    assert ticket_data["ticket"].startswith("ws-tk-")
    assert ticket_data["expires_in"] == 60
