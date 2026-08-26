from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.officers import router as officers_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(officers_router)
