import pytest
from httpx import AsyncClient
from starlette.testclient import TestClient
from app.core.config import settings
from app.main import app
from app.services.ticket_service import ticket_service
from app.services.ws_manager import ws_manager


@pytest.mark.asyncio
async def test_ticket_service_lifecycle():
    # 1. Crear ticket
    officer_id = "test-officer-uuid-123"
    role = "operador"
    ticket = await ticket_service.create_ticket(officer_id=officer_id, role=role, ttl=5)

    assert ticket.startswith("ws-tk-")

    # 2. Primer canje: exitoso
    consumed_data = await ticket_service.consume_ticket(ticket)
    assert consumed_data is not None
    assert consumed_data["officer_id"] == officer_id
    assert consumed_data["role"] == role

    # 3. Segundo canje (reutilización rechazada - un solo uso): None
    second_attempt = await ticket_service.consume_ticket(ticket)
    assert second_attempt is None


@pytest.mark.asyncio
async def test_internal_broadcast_endpoint(client: AsyncClient):
    payload = {
        "event_type": "NEW_CRIME_REPORT",
        "public_code": "LT-2026-000123",
        "priority": "urgente",
        "category_name": "Extorsión",
        "extra_data": {"description": "Llamada amenazante reportada"},
    }

    # 1. Petición sin Header de servicio (403)
    unauth_res = await client.post("/internal/v1/broadcast/alerts", json=payload)
    assert unauth_res.status_code == 403

    # 2. Petición con Header correcto (200)
    auth_res = await client.post(
        "/internal/v1/broadcast/alerts",
        json=payload,
        headers={"X-Internal-Service-Key": settings.INTERNAL_SERVICE_KEY},
    )
    assert auth_res.status_code == 200
    res_data = auth_res.json()
    assert res_data["status"] == "broadcasted"
    assert res_data["public_code"] == "LT-2026-000123"


def test_websocket_connection_and_broadcast():
    """Test de WebSocket sincrónico usando TestClient de Starlette."""
    # Usar TestClient síncrono para interactuar con el endpoint WebSocket
    with TestClient(app) as test_client:
        # 1. Conexión sin ticket -> Rechazada (código 1008)
        with pytest.raises(Exception):
            with test_client.websocket_connect("/ws/v1/police/alerts?ticket=invalido"):
                pass

        # 2. Generar ticket válido sincrónicamente inyectado
        import asyncio
        loop = asyncio.get_event_loop()
        ticket = loop.run_until_complete(
            ticket_service.create_ticket(
                officer_id="ws-test-officer", role="operador", ttl=60
            )
        )

        # 3. Conexión con ticket válido -> Aceptada y recibe mensaje CONNECTED
        with test_client.websocket_connect(f"/ws/v1/police/alerts?ticket={ticket}") as websocket:
            welcome_msg = websocket.receive_json()
            assert welcome_msg["event"] == "CONNECTED"
            assert welcome_msg["data"]["officer_id"] == "ws-test-officer"

            # 4. Enviar ping y recibir pong
            websocket.send_text("ping")
            pong = websocket.receive_text()
            assert pong == "pong"
