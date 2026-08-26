from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.dependencies import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ms-04-guias-contenido")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando MS-04 Guías, Trámites y Contenido Multimedia...")
    yield
    logger.info("Apagando MS-04...")
    await engine.dispose()


app = FastAPI(
    title="MS-04: Guías, Trámites y Contenido Multimedia",
    description="Microservicio de catálogo de trámites cívicos, guías interactivas en video (estilo TikTok), recursos descargables y métricas de visualización para La Tinguiña.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(api_v1_router)


@app.get("/healthz", tags=["Health"])
async def healthz():
    return {"status": "ok", "service": settings.SERVICE_NAME}


@app.get("/readyz", tags=["Health"])
async def readyz():
    return {"status": "ready", "service": settings.SERVICE_NAME}
