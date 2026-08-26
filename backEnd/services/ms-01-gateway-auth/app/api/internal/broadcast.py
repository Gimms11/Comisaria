from typing import Annotated
from fastapi import APIRouter, Depends, status
from app.core.dependencies import verify_internal_service_key
from app.schemas.websocket import BroadcastAlertPayload
from app.services.ws_manager import ws_manager

router = APIRouter(prefix="/internal/v1/broadcast", tags=["Broadcast Inter-Servicios"])


@router.post(
    "/alerts",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_internal_service_key)],
)
async def broadcast_alert(
    payload: BroadcastAlertPayload,
):
    """
    Endpoint interno invocado por MS-02 (Denuncias) y MS-03 (Reportes) para
    retransmitir alertas en tiempo real al panel policial vía WebSockets.
    """
    delivered_count = await ws_manager.broadcast_to_all(
        event=payload.event_type,
        data={
            "public_code": payload.public_code,
            "priority": payload.priority,
            "category_name": payload.category_name,
            "extra_data": payload.extra_data or {},
            "timestamp": payload.timestamp.isoformat(),
        },
    )

    return {
        "status": "broadcasted",
        "delivered_to_clients": delivered_count,
        "event": payload.event_type,
        "public_code": payload.public_code,
    }
