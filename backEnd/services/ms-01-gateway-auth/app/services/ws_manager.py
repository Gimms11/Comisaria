import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
from fastapi import WebSocket

logger = logging.getLogger("ws_manager")


class ConnectionManager:
    """
    Gestor centralizado de conexiones WebSocket para el Panel Policial.
    Mantiene el estado de las conexiones activas por oficial y por rol.
    """

    def __init__(self):
        # Mapeo: officer_id -> Set[WebSocket] (un oficial puede tener múltiples pestañas)
        self.active_officers: Dict[str, Set[WebSocket]] = {}
        # Mapeo: rol -> Set[WebSocket]
        self.role_rooms: Dict[str, Set[WebSocket]] = {
            "admin": set(),
            "comisario": set(),
            "operador": set(),
            "moderador": set(),
        }
        # Mapeo inverso: WebSocket -> (officer_id, role)
        self.socket_metadata: Dict[WebSocket, Tuple[str, str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, officer_id: str, role: str) -> None:
        """Acepta y registra una nueva conexión WebSocket autenticada."""
        await websocket.accept()
        async with self._lock:
            if officer_id not in self.active_officers:
                self.active_officers[officer_id] = set()
            self.active_officers[officer_id].add(websocket)

            if role in self.role_rooms:
                self.role_rooms[role].add(websocket)

            self.socket_metadata[websocket] = (officer_id, role)

        logger.info(f"WebSocket conectado: Oficial={officer_id}, Rol={role}. Conexiones activas: {len(self.socket_metadata)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remueve la conexión desconectada de todas las estructuras."""
        async with self._lock:
            meta = self.socket_metadata.pop(websocket, None)
            if meta:
                officer_id, role = meta
                if officer_id in self.active_officers:
                    self.active_officers[officer_id].discard(websocket)
                    if not self.active_officers[officer_id]:
                        del self.active_officers[officer_id]

                if role in self.role_rooms:
                    self.role_rooms[role].discard(websocket)

        logger.info(f"WebSocket desconectado. Conexiones restantes: {len(self.socket_metadata)}")

    async def broadcast_to_all(self, event: str, data: Dict[str, Any]) -> int:
        """Envía un mensaje a todos los clientes policiales conectados."""
        message = json.dumps({
            "event": event,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        async with self._lock:
            sockets = list(self.socket_metadata.keys())

        delivered = 0
        for ws in sockets:
            try:
                await ws.send_text(message)
                delivered += 1
            except Exception as e:
                logger.warning(f"Error enviando mensaje WebSocket a cliente: {e}")
                await self.disconnect(ws)

        return delivered

    async def broadcast_to_roles(self, roles: List[str], event: str, data: Dict[str, Any]) -> int:
        """Envía un mensaje a los oficiales que pertenezcan a los roles especificados."""
        message = json.dumps({
            "event": event,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        target_sockets: Set[WebSocket] = set()
        async with self._lock:
            for r in roles:
                target_sockets.update(self.role_rooms.get(r, set()))

        delivered = 0
        for ws in list(target_sockets):
            try:
                await ws.send_text(message)
                delivered += 1
            except Exception as e:
                logger.warning(f"Error enviando mensaje WebSocket a rol: {e}")
                await self.disconnect(ws)

        return delivered

    async def send_to_officer(self, officer_id: str, event: str, data: Dict[str, Any]) -> int:
        """Envía un mensaje específico a un oficial por su ID."""
        message = json.dumps({
            "event": event,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        async with self._lock:
            sockets = list(self.active_officers.get(officer_id, set()))

        delivered = 0
        for ws in sockets:
            try:
                await ws.send_text(message)
                delivered += 1
            except Exception as e:
                logger.warning(f"Error enviando mensaje WebSocket personal: {e}")
                await self.disconnect(ws)

        return delivered

    def get_stats(self) -> Dict[str, Any]:
        """Retorna métricas de conexiones activas."""
        return {
            "total_connections": len(self.socket_metadata),
            "unique_officers": len(self.active_officers),
            "by_role": {r: len(sockets) for r, sockets in self.role_rooms.items()},
        }


# Instancia singleton del gestor de conexiones
ws_manager = ConnectionManager()
