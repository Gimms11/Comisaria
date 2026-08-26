import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("ms-01")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Agrega un Correlation ID a cada petición para trazabilidad de logs estructurados."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        start_time = time.time()

        response = await call_next(request)

        duration = (time.time() - start_time) * 1000
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Response-Time-Ms"] = f"{duration:.2f}"

        logger.info(
            f"[{correlation_id}] {request.method} {request.url.path} -> {response.status_code} ({duration:.1f}ms)"
        )
        return response
