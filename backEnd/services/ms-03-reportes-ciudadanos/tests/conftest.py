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

ALUMBRADO_CAT_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
BACHES_CAT_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
POLICE_OFFICER_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_sessionmaker() as session:
        cat_alumbrado = ReportCategory(
            id=ALUMBRADO_CAT_ID,
            name="Alumbrado Público Dañado",
            slug="alumbrado-danado",
            applicable_type=ReportType.REPORTE_COMUNITARIO,
            is_active=True,
            sort_order=1,
        )
        cat_baches = ReportCategory(
            id=BACHES_CAT_ID,
            name="Baches y Vías Deterioradas",
            slug="baches-vias",
            applicable_type=ReportType.REPORTE_COMUNITARIO,
            is_active=True,
            sort_order=2,
        )
        officer = Officer(
            id=POLICE_OFFICER_ID,
            full_name="Operador Serenazgo",
            email="serenazgo@tinguina.pnp.gob.pe",
            password_hash=hash_password("SerenazgoPass2026!"),
            role=OfficerRole.OPERADOR,
            is_active=True,
        )
        session.add(cat_alumbrado)
        session.add(cat_baches)
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
def police_token() -> str:
    return create_access_token(
        data={"sub": str(POLICE_OFFICER_ID), "role": "operador", "email": "serenazgo@tinguina.pnp.gob.pe"},
        secret_key=settings.JWT_SECRET_KEY,
    )
