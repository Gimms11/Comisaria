import io
import pytest
from PIL import Image
from packages.shared.schemas.media_validator import (
    MediaUploadPayload,
    PayloadTooLargeError,
    InvalidMediaFormatError,
)


def create_image(format_name: str = "JPEG", size=(200, 200), color=(100, 150, 200)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format_name)
    return buf.getvalue()


def test_validator_accepts_valid_jpeg():
    raw_data = create_image("JPEG")
    payload = MediaUploadPayload(
        filename="foto.jpg",
        content_type="image/jpeg",
        file_bytes=raw_data,
    )
    assert payload.detected_mime_type == "image/jpeg"
    assert payload.detected_format == "JPEG"
    assert payload.width == 200
    assert payload.height == 200


def test_validator_accepts_valid_png():
    raw_data = create_image("PNG")
    payload = MediaUploadPayload(
        filename="foto.png",
        content_type="image/png",
        file_bytes=raw_data,
    )
    assert payload.detected_mime_type == "image/png"
    assert payload.detected_format == "PNG"


def test_validator_accepts_valid_webp():
    raw_data = create_image("WEBP")
    payload = MediaUploadPayload(
        filename="foto.webp",
        content_type="image/webp",
        file_bytes=raw_data,
    )
    assert payload.detected_mime_type == "image/webp"
    assert payload.detected_format == "WEBP"


def test_validator_rejects_empty_or_tiny_bytes():
    with pytest.raises(InvalidMediaFormatError) as exc:
        MediaUploadPayload.validate_file(
            filename="foto.jpg",
            content_type="image/jpeg",
            file_bytes=b"too small",
        )
    assert "demasiado pequeño" in str(exc.value).lower()


def test_validator_rejects_spoofed_file():
    # Extensión y content-type dicen ser JPEG, pero el contenido es un script
    fake_bytes = b"#!/bin/bash\nrm -rf /tmp/danger\n" * 10
    with pytest.raises(InvalidMediaFormatError) as exc:
        MediaUploadPayload.validate_file(
            filename="malicious.jpg",
            content_type="image/jpeg",
            file_bytes=fake_bytes,
        )
    assert "firma mágica" in str(exc.value).lower()


def test_validator_rejects_payload_exceeding_limit():
    raw_data = b"\xff\xd8\xff" + b"X" * 1500
    with pytest.raises(PayloadTooLargeError) as exc:
        MediaUploadPayload.validate_file(
            filename="large.jpg",
            content_type="image/jpeg",
            file_bytes=raw_data,
            max_size_bytes=1000,
        )
    assert "supera el límite" in str(exc.value).lower()


def test_validator_rejects_decompression_bomb_dimensions():
    bomb_img = Image.new("RGB", (8001, 50), color=(0, 0, 0))
    buf = io.BytesIO()
    bomb_img.save(buf, format="JPEG")
    with pytest.raises(InvalidMediaFormatError) as exc:
        MediaUploadPayload.validate_file(
            filename="bomb.jpg",
            content_type="image/jpeg",
            file_bytes=buf.getvalue(),
        )
    assert "dimensiones no permitidas" in str(exc.value).lower()
