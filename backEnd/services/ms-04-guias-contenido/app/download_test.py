import asyncio
from app.services.tiktok_downloader import tiktok_downloader

async def test_download():
    url = "https://www.tiktok.com/@mafesinr/video/7678096825106042120?is_from_webapp=1&sender_device=pc&web_id=7649958215388186129"
    print("Iniciando descarga...")
    try:
        minio_url = await tiktok_downloader.process_tiktok_url(url, "test_guide")
        print(f"ÉXITO. URL EN MINIO: {minio_url}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_download())
