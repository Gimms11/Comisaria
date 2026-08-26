from fastapi import APIRouter
from app.api.v1.admin_guides import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.categories import router as categories_router
from app.api.v1.guides import router as guides_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(guides_router)
api_v1_router.include_router(categories_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(admin_router)
