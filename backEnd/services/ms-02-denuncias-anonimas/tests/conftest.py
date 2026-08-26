import asyncio
from typing import AsyncGenerator
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from packages.shared.database import Base
from packages.shared.models.officer import Officer
from packages.shared.models.report_category import ReportCategory
from packages.shared.schemas.enums import OfficerRole, ReportType
from packages.shared.security import create_access_token, hash_password
from app.core.config import settings
from app.core.dependencies import get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_sessionmaker = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

EXTORSION_CAT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ROBO_CAT_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
ADMIN_OFFICER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_sessionmaker() as session:
        # Categorías de delitos
        cat_extorsion = ReportCategory(
            id=EXTORSION_CAT_ID,
            name="Extorsión y Cobro de Cupos",
            slug="extorsion-tinguina",
            applicable_type=ReportType.DENUNCIA_ANONIMA,
            is_emergency_default=True,
            is_active=True,
            sort_order=1,
        )
        cat_robo = ReportCategory(
            id=ROBO_CAT_ID,
            name="Robo a Mano Armada",
            slug="robo-tinguina",
            applicable_type=ReportType.DENUNCIA_ANONIMA,
            is_emergency_default=False,
            is_active=True,
            sort_order=2,
        )
        # Oficial admin
        officer = Officer(
            id=ADMIN_OFFICER_ID,
            full_name="Mayor PNP Inspector",
            email="inspector@tinguina.pnp.gob.pe",
            password_hash=hash_password("InspectorPass2026!"),
            role=OfficerRole.ADMIN,
            is_active=True,
        )
        session.add(cat_extorsion)
        session.add(cat_robo)
        session.add(officer)
        await session.commit()

        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def police_auth_token() -> str:
    """Genera token JWT válido de oficial policial."""
    return create_access_token(
        data={"sub": str(ADMIN_OFFICER_ID), "role": "admin", "email": "inspector@tinguina.pnp.gob.pe"},
        secret_key=settings.JWT_SECRET_KEY,
    )
