from typing import AsyncGenerator
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from packages.shared.database import Base
from packages.shared.models.guide import Guide
from packages.shared.models.guide_category import GuideCategory
from packages.shared.models.officer import Officer
from packages.shared.schemas.enums import GuideContentType, OfficerRole
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

TRAMITES_CAT_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
PREVENCION_CAT_ID = uuid.UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")
EDITOR_OFFICER_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
SAMPLE_GUIDE_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_sessionmaker() as session:
        cat_tramites = GuideCategory(
            id=TRAMITES_CAT_ID,
            name="Trámites y Documentos",
            slug="tramites-documentos",
            is_active=True,
            sort_order=1,
        )
        cat_prevencion = GuideCategory(
            id=PREVENCION_CAT_ID,
            name="Prevención del Delito",
            slug="prevencion-delito",
            is_active=True,
            sort_order=2,
        )
        officer = Officer(
            id=EDITOR_OFFICER_ID,
            full_name="Suboficial Editor Cívico",
            email="editor@tinguina.pnp.gob.pe",
            password_hash=hash_password("EditorPass2026!"),
            role=OfficerRole.ADMIN,
            is_active=True,
        )
        guide = Guide(
            id=SAMPLE_GUIDE_ID,
            category_id=TRAMITES_CAT_ID,
            title="¿Qué hacer si perdiste tu DNI en La Tinguiña?",
            slug="que-hacer-si-perdiste-tu-dni",
            summary="Paso a paso para tramitar el duplicado o denuncia policial.",
            content_type=GuideContentType.VIDEO,
            main_video_url="https://storage.googleapis.com/tinguina/dni_lost.mp4",
            duration_seconds=45,
            is_featured=True,
            is_published=True,
            sort_order=1,
        )

        session.add(cat_tramites)
        session.add(cat_prevencion)
        session.add(officer)
        session.add(guide)
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
def admin_token() -> str:
    return create_access_token(
        data={"sub": str(EDITOR_OFFICER_ID), "role": "admin", "email": "editor@tinguina.pnp.gob.pe"},
        secret_key=settings.JWT_SECRET_KEY,
    )
