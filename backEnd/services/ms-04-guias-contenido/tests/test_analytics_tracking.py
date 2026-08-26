import pytest
from httpx import AsyncClient
from tests.conftest import SAMPLE_GUIDE_ID


@pytest.mark.asyncio
async def test_track_interactions_and_counts(client: AsyncClient):
    # 1. Registrar 2 vistas (view)
    await client.post(f"/api/v1/guides/{SAMPLE_GUIDE_ID}/track", json={"event_type": "view"})
    track_res1 = await client.post(f"/api/v1/guides/{SAMPLE_GUIDE_ID}/track", json={"event_type": "view"})
    assert track_res1.status_code == 200
    assert track_res1.json()["view_count"] == 2

    # 2. Registrar 1 útil (helpful)
    helpful_res = await client.post(f"/api/v1/guides/{SAMPLE_GUIDE_ID}/track", json={"event_type": "helpful"})
    assert helpful_res.status_code == 200
    assert helpful_res.json()["helpful_count"] == 1

    # 3. Comprobar en el detalle público que los contadores coinciden
    detail_res = await client.get("/api/v1/guides/que-hacer-si-perdiste-tu-dni")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["view_count"] == 2
    assert detail["helpful_count"] == 1
