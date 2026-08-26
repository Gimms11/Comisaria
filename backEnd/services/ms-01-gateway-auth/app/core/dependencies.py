import uuid
from typing import Annotated, AsyncGenerator, Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from packages.shared.database import get_async_engine, get_sessionmaker
from packages.shared.models.officer import Officer
from packages.shared.schemas.enums import OfficerRole
from packages.shared.security import decode_token
from app.core.config import settings

# Instancias globales de motor y sesión
engine: AsyncEngine = get_async_engine(settings.DATABASE_URL)
sessionmaker: async_sessionmaker[AsyncSession] = get_sessionmaker(engine)

security_bearer = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Inyección de dependencia para sesión de base de datos."""
    async with sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_officer(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Officer:
    """Extrae y valida el JWT de acceso del header Authorization: Bearer <token>."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales no proporcionadas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(
            credentials.credentials,
            secret_key=settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de acceso ha expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.PyJWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    officer_id_str = payload.get("sub")
    if not officer_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        officer_uuid = uuid.UUID(officer_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID de oficial inválido en token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    query = select(Officer).where(Officer.id == officer_uuid)
    result = await db.execute(query)
    officer = result.scalar_one_or_none()

    if not officer or not officer.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Oficial no encontrado o inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return officer


def require_roles(*allowed_roles: OfficerRole) -> Callable:
    """Control de acceso basado en roles (RBAC)."""
    async def role_checker(
        current_officer: Annotated[Officer, Depends(get_current_officer)]
    ) -> Officer:
        if current_officer.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso denegado. Se requiere uno de los roles: {[r.value for r in allowed_roles]}",
            )
        return current_officer

    return role_checker


async def verify_internal_service_key(
    x_internal_service_key: Annotated[Optional[str], Header(alias="X-Internal-Service-Key")] = None
) -> bool:
    """Valida la clave secreta en llamadas entre microservicios."""
    if not x_internal_service_key or x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso inter-servicios no autorizado",
        )
    return True
