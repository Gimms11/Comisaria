import asyncio
import logging
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from app.services.ticket_service import ticket_service
from app.services.ws_manager import ws_manager

logger = logging.getLogger("ws_police")
router = APIRouter(tags=["WebSocket Hub Policial"])


@router.websocket("/ws/v1/police/alerts")
async def police_alerts_websocket(
    websocket: WebSocket,
    ticket: str = Query(..., description="Ticket efímero de un solo uso generado por /auth/ws-ticket"),
):
    """
    Canal WebSocket en tiempo real para el Panel Policial.
    Exige un ticket efímero de un solo uso en lugar de exponer JWTs.
    """
    # 1. Validar y canjear ticket de un solo uso
    ticket_data = await ticket_service.consume_ticket(ticket)
    if not ticket_data:
        logger.warning("Intento de conexión WebSocket con ticket inválido o expirado")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Ticket inválido o expirado")
        return

    officer_id = ticket_data["officer_id"]
    role = ticket_data["role"]

    # 2. Conectar y registrar en ConnectionManager
    await ws_manager.connect(websocket, officer_id=officer_id, role=role)

    try:
        # 3. Enviar mensaje de bienvenida / confirmación
        await websocket.send_json({
            "event": "CONNECTED",
            "data": {
                "officer_id": officer_id,
                "role": role,
                "message": "Conectado exitosamente al Hub de Alertas de la Comisaría",
            },
        })

        while True:
            # Mantener la conexión abierta y procesar pings / mensajes del cliente
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info(f"WebSocket desconectado normalmente: Oficial={officer_id}")
    except Exception as e:
        logger.warning(f"WebSocket cerrado con excepción: {e}")
    finally:
        await ws_manager.disconnect(websocket)
