import io
import pytest
from PIL import Image
from httpx import AsyncClient
from tests.conftest import EXTORSION_CAT_ID, ROBO_CAT_ID


def generate_valid_photo(color=(50, 150, 200), width=640, height=480) -> bytes:
    """Genera imagen JPEG válida en memoria."""
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_mobile_flow_anonymous_crime_report_e2e(client: AsyncClient):
    """
    Flujo Móvil Ciudadano Completo:
    1. Obtener catálogo de categorías de delitos.
    2. Enviar denuncia anónima con geolocalización y PIN de 6 dígitos.
    3. Subir fotografía de evidencia (verificada con Pydantic y sanitizada sin EXIF).
    4. Consultar estado con código público + PIN.
    5. Confirmar persistencia y aislamiento de datos personales.
    """
    # 1. Catálogo de categorías
    cat_res = await client.get("/api/v1/categories/")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) >= 2
    extorsion_cat = next(c for c in categories if c["id"] == str(EXTORSION_CAT_ID))
    assert extorsion_cat["slug"] == "extorsion-tinguina"

    # 2. Registrar denuncia
    payload = {
        "category_id": str(EXTORSION_CAT_ID),
        "description": "Dejaron sobre con dinamita y nota en fachada de bodega.",
        "latitude": -14.0325,
        "longitude": -75.7241,
        "reference": "A espaldas del mercado central de La Tinguiña",
        "followup_code": "654321",
    }
    report_res = await client.post("/api/v1/reports", json=payload)
    assert report_res.status_code == 201
    report_data = report_res.json()
    public_code = report_data["public_code"]
    assert public_code.startswith("LT-")
    assert report_data["status"] == "pendiente"


    # 3. Subir foto de evidencia con validación de tipo real
    photo_bytes = generate_valid_photo(color=(120, 20, 30))
    files = {"file": ("fachada_nota.jpg", photo_bytes, "image/jpeg")}
    upload_res = await client.post(f"/api/v1/reports/{public_code}/media", files=files)
    assert upload_res.status_code == 201
    media_data = upload_res.json()
    assert media_data["status"] == "uploaded"
    assert media_data["media_type"] == "foto"
    assert media_data["size_bytes"] > 0

    # 4. Verificación ciudadana con PIN correcto
    track_res = await client.get(f"/api/v1/reports/{public_code}/status?followup_code=654321")
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["public_code"] == public_code
    assert track_data["is_verified"] is True
    assert "dinamita" in track_data["description"]

    # 5. Verificación sin PIN (debe ofuscar descripción)
    unauth_track_res = await client.get(f"/api/v1/reports/{public_code}/status")
    assert unauth_track_res.status_code == 200
    unauth_data = unauth_track_res.json()
    assert unauth_data["is_verified"] is False
    assert "protegida" in unauth_data["description"]


