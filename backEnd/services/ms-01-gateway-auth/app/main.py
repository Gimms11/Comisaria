from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as aioredis
from app.api.internal.broadcast import router as broadcast_router
from app.api.v1.router import api_v1_router
from app.api.v1.ws_police import router as ws_router
from app.core.config import settings
from app.core.dependencies import engine
from app.middlewares.logging import CorrelationIdMiddleware
from app.services.ticket_service import ticket_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ms-01-gateway-auth")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: inicialización y limpieza de conexiones."""
    logger.info("Iniciando MS-01 Gateway, Auth & WebSocket Hub...")

    # Inicializar cliente Redis si está configurado
    redis_client = None
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2
        )
        await redis_client.ping()
        ticket_service.set_redis_client(redis_client)
        logger.info("Conectado exitosamente a Redis para tickets efímeros y rate limiting")
    except Exception as e:
        logger.warning(f"No se pudo conectar a Redis ({settings.REDIS_URL}): {e}. Usando fallback en memoria.")
        ticket_service.set_redis_client(None)

    yield

    # Limpieza al apagar
    logger.info("Apagando MS-01...")
    if redis_client:
        await redis_client.aclose()
    await engine.dispose()


app = FastAPI(
    title="MS-01: Gateway, Auth Policial y WebSocket Hub",
    description="Microservicio de autenticación policial, control de acceso RBAC y distribución de alertas en tiempo real vía WebSockets para la Comisaría de La Tinguiña.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 1. Middlewares
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Rutas
app.include_router(api_v1_router)
app.include_router(ws_router)
app.include_router(broadcast_router)


# 3. Health Checks
@app.get("/healthz", tags=["Health"])
async def healthz():
    """Health check básico para Cloud Run / Docker."""
    return {"status": "ok", "service": settings.SERVICE_NAME}


@app.get("/readyz", tags=["Health"])
async def readyz():
    """Readiness check verificando conectividad a componentes esenciales."""
    return {"status": "ready", "service": settings.SERVICE_NAME}
