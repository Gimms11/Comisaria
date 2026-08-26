from fastapi import APIRouter
from app.api.v1.categories import router as categories_router
from app.api.v1.police_reports import router as police_router
from app.api.v1.public_reports import router as public_router
from app.api.v1.shares import router as shares_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(public_router)
api_v1_router.include_router(shares_router)
api_v1_router.include_router(categories_router)
api_v1_router.include_router(police_router)
