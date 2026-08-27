import logging
import httpx
from uuid import uuid4
from typing import Optional
from app.core.config import settings
from app.schemas.guide import TIKTOK_LONG_URL_REGEX, TIKTOK_SHORT_URL_REGEX
from app.services.video_storage import video_storage

logger = logging.getLogger("tiktok_downloader")

class TikTokDownloader:
    def __init__(self):
        self.api_url = settings.TIKTOK_API_URL
        self.api_key = settings.TIKTOK_API_KEY
        self.api_host = settings.TIKTOK_API_HOST

    def resolve_tiktok_url(self, url: str) -> str:
        url = url.strip()
        if not url:
            return url

        if TIKTOK_LONG_URL_REGEX.match(url):
            return url.split("?")[0]

        if not TIKTOK_SHORT_URL_REGEX.match(url):
            raise ValueError("URL inválida. Pegue un enlace de TikTok válido.")

        try:
            with httpx.Client(follow_redirects=True, timeout=10) as client:
                response = client.head(url)
                resolved = str(response.url)
        except httpx.HTTPError:
            raise ValueError("No se pudo resolver la URL corta de TikTok.")

        if not TIKTOK_LONG_URL_REGEX.match(resolved):
            raise ValueError("La URL no redirige a un video de TikTok válido.")

        return resolved.split("?")[0]

    async def _fetch_video_info(self, tiktok_url: str) -> dict:
        if not self.api_key:
            logger.warning("TIKTOK_API_KEY no configurada. Simulando descarga local...")
            raise ValueError("TIKTOK_API_KEY no está configurada en el backend.")

        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.api_host
        }
        querystring = {"url": tiktok_url, "hd": "1"}

        async with httpx.AsyncClient(timeout=25.0) as client:
            try:
                response = await client.get(self.api_url, headers=headers, params=querystring)
                response.raise_for_status()
                data = response.json()

                # Extraer URL del video
                play_url = None
                duration = None
                cover = None

                if "data" in data and isinstance(data["data"], dict):
                    inner = data["data"]
                    play_url = inner.get("play") or inner.get("hdplay") or inner.get("wmplay")
                    duration = inner.get("duration")
                    cover = inner.get("cover") or inner.get("origin_cover")
                elif "play" in data:
                    play_url = data["play"]
                    duration = data.get("duration")
                    cover = data.get("cover")

                if not play_url:
                    logger.error(f"Respuesta inesperada de TikTok API: {data}")
                    raise ValueError("No se pudo extraer el video de la respuesta de la API.")

                return {
                    "play_url": play_url,
                    "duration": int(duration) if duration is not None else None,
                    "cover": cover,
                }
            except httpx.HTTPError as e:
                logger.error(f"Error llamando a TikTok API: {e}")
                raise ValueError("Error al comunicarse con el servicio de descarga de TikTok.")

    async def _download_mp4(self, mp4_url: str) -> bytes:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(mp4_url)
                response.raise_for_status()
                return response.content
            except httpx.HTTPError as e:
                logger.error(f"Error descargando el MP4: {e}")
                raise ValueError("Error al descargar el archivo de video.")

    async def process_tiktok_url(self, tiktok_url: str, guide_slug: str) -> dict:
        resolved_url = self.resolve_tiktok_url(tiktok_url)
        info = await self._fetch_video_info(resolved_url)
        video_bytes = await self._download_mp4(info["play_url"])
        storage_path = f"guides/{guide_slug}_{uuid4().hex[:8]}.mp4"
        permanent_url = await video_storage.upload_file(
            video_bytes, storage_path, "video/mp4"
        )
        return {
            "video_url": permanent_url,
            "duration": info.get("duration"),
            "cover": info.get("cover"),
        }

tiktok_downloader = TikTokDownloader()
