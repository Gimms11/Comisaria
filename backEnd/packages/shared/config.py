from typing import List, Optional, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class SharedSettings(BaseSettings):
    """Configuraciones base compartidas para todos los microservicios."""

    DATABASE_URL: str = (
        "postgresql+asyncpg://comisaria:dev_password_2026@localhost:5432/comisaria_db"
    )
    REDIS_URL: str = "redis://localhost:6379/0"

    # Claves secretas de seguridad
    JWT_SECRET_KEY: str = "dev-jwt-secret-key-2026-cambiar-en-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Clave para autenticación inter-servicios
    INTERNAL_SERVICE_KEY: str = "dev-internal-secret-key-2026"

    # Clave HMAC para hash de código de seguimiento ciudadano
    FOLLOWUP_HMAC_KEY: str = "dev-hmac-followup-key-2026"

    # TikTok API Key (RapidAPI)
    TIKTOK_API_KEY: Optional[str] = None


    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )
