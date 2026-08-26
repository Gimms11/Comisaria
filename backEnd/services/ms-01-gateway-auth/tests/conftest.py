import asyncio
import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from packages.shared.database import Base
from packages.shared.models.officer import Officer
from packages.shared.schemas.enums import OfficerRole
from packages.shared.security import hash_password
from app.core.dependencies import get_db
from app.main import app

# Base de datos SQLite asíncrona en memoria para tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_sessionmaker = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Crea y destruye el esquema para cada test individual."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_sessionmaker() as session:
        # Seed admin y operador de prueba
        admin_officer = Officer(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            full_name="Comisario Mayor Admin",
            email="admin@tinguina.pnp.gob.pe",
            password_hash=hash_password("AdminPass2026!"),
            role=OfficerRole.ADMIN,
            is_active=True,
        )
        operador_officer = Officer(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            full_name="Suboficial Operador",
            email="operador@tinguina.pnp.gob.pe",
            password_hash=hash_password("OperadorPass2026!"),
            role=OfficerRole.OPERADOR,
            is_active=True,
        )
        session.add(admin_officer)
        session.add(operador_officer)
        await session.commit()

        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Cliente HTTP asíncrono para interactuar con la app FastAPI."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
