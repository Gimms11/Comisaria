import pytest
from httpx import AsyncClient
from tests.conftest import TRAMITES_CAT_ID, SAMPLE_GUIDE_ID


@pytest.mark.asyncio
async def test_mobile_flow_4_tiktok_guides_feed_e2e(client: AsyncClient):
    """
    Flujo 4: Biblioteca de Prevención Digital Estilo TikTok
    Paso 1: Pantalla carga categorías de guías (/api/v1/guide-categories/)
    Paso 2: Feed vertical lista micro-videos publicados (/api/v1/guides/)
    Paso 3: Búsqueda en tiempo real por texto (/api/v1/guides/?search=dni)
    Paso 4: Filtro por categoría seleccionada (/api/v1/guides/?category_id=...)
    Paso 5: Detalle completo de la guía y pasos interactivos (/api/v1/guides/{slug})
    Paso 6: Registro de visualización (/api/v1/guides/{id}/track con event_type=view)
    Paso 7: Registro de valoración 'Me ayudó' (/api/v1/guides/{id}/track con event_type=helpful)
    """
    # 1. Cargar categorías de guías
    cat_res = await client.get("/api/v1/guide-categories/")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) >= 1
    tramites_cat = next(c for c in categories if c["id"] == str(TRAMITES_CAT_ID))
    assert tramites_cat["name"] == "Trámites y Documentos"
    assert tramites_cat["is_active"] is True

    # 2. Listar feed de guías publicadas
    guides_res = await client.get("/api/v1/guides/")
    assert guides_res.status_code == 200
    guides = guides_res.json()
    assert len(guides) >= 1
    first_guide = guides[0]
    assert "title" in first_guide
    assert "main_video_url" in first_guide
    assert "slug" in first_guide

    # 3. Búsqueda por texto ("DNI")
    search_res = await client.get("/api/v1/guides/?search=dni")
    assert search_res.status_code == 200
    search_results = search_res.json()
    assert len(search_results) >= 1
    assert "dni" in search_results[0]["title"].lower() or "dni" in search_results[0]["summary"].lower()

    # 4. Filtro por categoría
    filter_res = await client.get(f"/api/v1/guides/?category_id={TRAMITES_CAT_ID}")
    assert filter_res.status_code == 200
    filtered = filter_res.json()
    assert len(filtered) >= 1

    # 5. Detalle de guía y recursos
    slug = first_guide["slug"]
    detail_res = await client.get(f"/api/v1/guides/{slug}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["slug"] == slug
    assert "resources" in detail
    assert "category" in detail

    # 6. Registrar vista
    guide_id = detail["id"]
    view_res = await client.post(
        f"/api/v1/guides/{guide_id}/track",
        json={"event_type": "view"},
    )
    assert view_res.status_code == 200
    assert view_res.json()["view_count"] >= 1

    # 7. Registrar valoración "Me ayudó"
    helpful_res = await client.post(
        f"/api/v1/guides/{guide_id}/track",
        json={"event_type": "helpful"},
    )
    assert helpful_res.status_code == 200
    assert helpful_res.json()["helpful_count"] >= 1


@pytest.mark.asyncio
async def test_mobile_flow_4_edge_cases(client: AsyncClient):
    """
    Casos límite para la Biblioteca de Guías:
    - Búsqueda sin coincidencias -> 200 con array vacío []
    - Slug o ID inexistente -> 404
    - Tipo de evento no soportado -> 400
    """
    # Búsqueda sin resultados
    empty_search = await client.get("/api/v1/guides/?search=palabra_imposible_xyz_123")
    assert empty_search.status_code == 200
    assert empty_search.json() == []

    # Guía inexistente
    not_found = await client.get("/api/v1/guides/guia-inexistente-12345")
    assert not_found.status_code == 404

    # Evento de tracking inválido
    bad_track = await client.post(
        f"/api/v1/guides/{SAMPLE_GUIDE_ID}/track",
        json={"event_type": "dislike_invalido"},
    )
    assert bad_track.status_code == 400
