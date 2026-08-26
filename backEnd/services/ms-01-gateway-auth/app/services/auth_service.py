import uuid
from datetime import timedelta
from typing import Optional, Tuple
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from packages.shared.models.officer import Officer
from packages.shared.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.core.config import settings
from app.schemas.auth import TokenResponse


class AuthService:
    """Lógica de autenticación, verificación de credenciales y emisión de JWT."""

    @staticmethod
    async def authenticate_officer(
        db: AsyncSession, email: str, password: str
    ) -> Optional[Officer]:
        query = select(Officer).where(Officer.email == email.lower().strip())
        result = await db.execute(query)
        officer = result.scalar_one_or_none()

        if not officer or not officer.is_active:
            return None

        if not verify_password(password, officer.password_hash):
            return None

        return officer

    @staticmethod
    def generate_tokens(officer: Officer) -> TokenResponse:
        data = {
            "sub": str(officer.id),
            "email": officer.email,
            "role": officer.role.value,
        }
        access_token = create_access_token(
            data=data,
            secret_key=settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
            expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        refresh_token = create_refresh_token(
            data=data,
            secret_key=settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
            expires_delta=timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    async def refresh_access_token(
        db: AsyncSession, refresh_token_str: str
    ) -> Optional[TokenResponse]:
        try:
            payload = decode_token(
                refresh_token_str,
                secret_key=settings.JWT_SECRET_KEY,
                algorithm=settings.JWT_ALGORITHM,
            )
            if payload.get("type") != "refresh":
                return None

            officer_id_str = payload.get("sub")
            if not officer_id_str:
                return None

            try:
                officer_uuid = uuid.UUID(officer_id_str)
            except (ValueError, TypeError):
                return None

            query = select(Officer).where(Officer.id == officer_uuid)
            result = await db.execute(query)
            officer = result.scalar_one_or_none()

            if not officer or not officer.is_active:
                return None

            return AuthService.generate_tokens(officer)
        except (jwt.PyJWTError, Exception):
            return None
