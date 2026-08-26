import pytest
from httpx import AsyncClient
from tests.conftest import SAMPLE_GUIDE_ID


@pytest.mark.asyncio
async def test_list_guide_categories(client: AsyncClient):
    response = await client.get("/api/v1/guide-categories/")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) == 2
    assert categories[0]["slug"] == "tramites-documentos"


@pytest.mark.asyncio
async def test_list_published_guides(client: AsyncClient):
    response = await client.get("/api/v1/guides/")
    assert response.status_code == 200
    guides = response.json()
    assert len(guides) == 1
    assert guides[0]["slug"] == "que-hacer-si-perdiste-tu-dni"
    assert guides[0]["is_featured"] is True


@pytest.mark.asyncio
async def test_get_guide_by_slug(client: AsyncClient):
    response = await client.get("/api/v1/guides/que-hacer-si-perdiste-tu-dni")
    assert response.status_code == 200
    guide = response.json()
    assert guide["id"] == str(SAMPLE_GUIDE_ID)
    assert guide["title"] == "¿Qué hacer si perdiste tu DNI en La Tinguiña?"
    assert guide["content_type"] == "video"


@pytest.mark.asyncio
async def test_search_guides(client: AsyncClient):
    hit_res = await client.get("/api/v1/guides/?search=DNI")
    assert hit_res.status_code == 200
    assert len(hit_res.json()) == 1

    miss_res = await client.get("/api/v1/guides/?search=PalabraInexistente99")
    assert miss_res.status_code == 200
    assert len(miss_res.json()) == 0
