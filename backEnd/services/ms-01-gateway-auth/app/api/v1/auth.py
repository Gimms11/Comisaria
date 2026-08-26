from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from app.core.dependencies import get_current_officer, get_db
from app.schemas.auth import (
    LoginRequest,
    OfficerProfileResponse,
    RefreshTokenRequest,
    TokenResponse,
    WSTicketResponse,
)
from app.services.auth_service import AuthService
from app.services.ticket_service import ticket_service

router = APIRouter(prefix="/auth", tags=["Autenticación Policial"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Inicia sesión para personal policial y retorna tokens JWT."""
    officer = await AuthService.authenticate_officer(
        db, email=login_data.email, password=login_data.password
    )
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthService.generate_tokens(officer)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Renueva el token de acceso mediante el token de refresco."""
    tokens = await AuthService.refresh_access_token(
        db, refresh_token_str=refresh_data.refresh_token
    )
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return tokens


@router.get("/me", response_model=OfficerProfileResponse)
async def get_my_profile(
    current_officer: Annotated[Officer, Depends(get_current_officer)],
):
    """Retorna el perfil del oficial autenticado."""
    return current_officer


@router.post("/ws-ticket", response_model=WSTicketResponse)
async def generate_ws_ticket(
    current_officer: Annotated[Officer, Depends(get_current_officer)],
):
    """
    Genera un ticket efímero de un solo uso para conectar el WebSocket sin exponer el JWT en la URL.
    Válido por 60 segundos.
    """
    ticket = await ticket_service.create_ticket(
        officer_id=str(current_officer.id),
        role=current_officer.role.value,
        ttl=60,
    )
    return WSTicketResponse(ticket=ticket, expires_in=60)
