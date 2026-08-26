import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status


class LoginRateLimiter:
    """Rate limiter simple en memoria para mitigar fuerza bruta en el endpoint de login."""

    def __init__(self, max_attempts: int = 5, window_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        # Mapeo: client_ip -> lista de timestamps de intentos fallidos
        self._failed_attempts: Dict[str, List[float]] = defaultdict(list)

    def check_rate_limit(self, client_ip: str) -> None:
        now = time.time()
        # Filtrar intentos fuera de la ventana
        self._failed_attempts[client_ip] = [
            t for t in self._failed_attempts[client_ip] if now - t < self.window_seconds
        ]

        if len(self._failed_attempts[client_ip]) >= self.max_attempts:
            retry_after = int(self.window_seconds - (now - self._failed_attempts[client_ip][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Demasiados intentos fallidos. Intente nuevamente en {max(1, retry_after)} segundos.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

    def record_failure(self, client_ip: str) -> None:
        self._failed_attempts[client_ip].append(time.time())

    def reset(self, client_ip: str) -> None:
        self._failed_attempts.pop(client_ip, None)


login_rate_limiter = LoginRateLimiter()
