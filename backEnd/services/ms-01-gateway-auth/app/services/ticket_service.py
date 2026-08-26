import json
import secrets
import time
from typing import Any, Dict, Optional, Tuple
import redis.asyncio as aioredis


class WSTicketService:
    """
    Servicio de emisión y canje de tickets efímeros de un solo uso para WebSockets.
    Soporta Redis distribuido con fallback en memoria para tests o entornos simples.
    """

    def __init__(self, redis_client: Optional[aioredis.Redis] = None, default_ttl: int = 60):
        self.redis = redis_client
        self.default_ttl = default_ttl
        self._memory_store: Dict[str, Tuple[Dict[str, Any], float]] = {}

    def set_redis_client(self, client: Optional[aioredis.Redis]) -> None:
        self.redis = client

    async def create_ticket(self, officer_id: str, role: str, ttl: Optional[int] = None) -> str:
        ttl_seconds = ttl or self.default_ttl
        ticket_id = f"ws-tk-{secrets.token_hex(16)}"
        payload = {
            "officer_id": officer_id,
            "role": role,
            "created_at": time.time(),
        }

        if self.redis:
            try:
                await self.redis.set(f"ws_ticket:{ticket_id}", json.dumps(payload), ex=ttl_seconds)
                return ticket_id
            except Exception:
                pass  # Fallback a memoria si Redis falla

        # Memoria local
        expiry = time.time() + ttl_seconds
        self._memory_store[ticket_id] = (payload, expiry)
        self._clean_expired_memory()
        return ticket_id

    async def consume_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Canjea el ticket de forma atómica (un solo uso)."""
        if not ticket_id:
            return None

        if self.redis:
            try:
                raw_data = await self.redis.getdel(f"ws_ticket:{ticket_id}")
                if raw_data:
                    if isinstance(raw_data, bytes):
                        raw_data = raw_data.decode("utf-8")
                    return json.loads(raw_data)
            except Exception:
                pass

        # Memoria local
        self._clean_expired_memory()
        if ticket_id in self._memory_store:
            payload, expiry = self._memory_store.pop(ticket_id)
            if time.time() <= expiry:
                return payload

        return None

    def _clean_expired_memory(self) -> None:
        now = time.time()
        expired = [k for k, (_, exp) in self._memory_store.items() if now > exp]
        for k in expired:
            self._memory_store.pop(k, None)


# Instancia singleton del servicio de tickets
ticket_service = WSTicketService()
