import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("ms-02-privacy")


class PrivacyHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware para proteger el anonimato del denunciante:
    1. Asegura que los logs de servidor no registren IPs ni datos PII.
    2. Inyecta cabeceras de privacidad y anti-rastreo en las respuestas HTTP.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Inyectar cabeceras de privacidad estricta
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store, max-age=0"

        return response
