from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.public_reports import preview_router
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.dependencies import engine
from app.middlewares.privacy_headers import PrivacyHeadersMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ms-03-reportes-ciudadanos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando MS-03 Reportes Ciudadanos y Comunitarios...")
    yield
    logger.info("Apagando MS-03...")
    await engine.dispose()


app = FastAPI(
    title="MS-03: Reportes Ciudadanos y Comunitarios",
    description="Microservicio de registro de incidencias cívicas, soporte para difusión en redes sociales y derivaciones a Serenazgo/Municipio para La Tinguiña.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

# Middlewares
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")
app.add_middleware(PrivacyHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(api_v1_router)
app.include_router(preview_router)


@app.get("/healthz", tags=["Health"])
async def healthz():
    return {"status": "ok", "service": settings.SERVICE_NAME}


@app.get("/readyz", tags=["Health"])
async def readyz():
    return {"status": "ready", "service": settings.SERVICE_NAME}
