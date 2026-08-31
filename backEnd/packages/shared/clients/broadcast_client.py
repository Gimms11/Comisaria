import logging
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger("broadcast_client")


class BroadcastClient:
    """Cliente HTTP asíncrono para notificar eventos en tiempo real al WebSocket Hub (MS-01)."""

    def __init__(self, ms01_url: str, internal_service_key: str, timeout: float = 2.0):
        self.ms01_url = ms01_url.rstrip("/")
        self.internal_service_key = internal_service_key
        self.timeout = timeout

    async def emit_alert(
        self,
        event_type: str,
        public_code: str,
        priority: str,
        category_name: str,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Emite una alerta al endpoint interno de MS-01.
        No bloquea el flujo principal si MS-01 está temporalmente no disponible (fire and forget con logging).
        """
        endpoint = f"{self.ms01_url}/internal/v1/broadcast/alerts"
        headers = {
            "X-Internal-Service-Key": self.internal_service_key,
            "Content-Type": "application/json",
        }
        payload = {
            "event_type": event_type,
            "public_code": public_code,
            "priority": priority,
            "category_name": category_name,
            "extra_data": extra_data or {},
        }

        timeout_config = httpx.Timeout(self.timeout, connect=1.0)
        try:
            async with httpx.AsyncClient(timeout=timeout_config) as client:
                response = await client.post(endpoint, json=payload, headers=headers)
                if response.status_code == 200:
                    logger.info(f"Broadcast exitoso a MS-01 para reporte {public_code}")
                    return True
                else:
                    logger.warning(
                        f"MS-01 respondió con código {response.status_code} al emitir broadcast: {response.text}"
                    )
                    return False
        except Exception as e:
            logger.error(f"Fallo al conectar con MS-01 para broadcast ({endpoint}): {str(e)}")
            return False
