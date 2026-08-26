import pytest
from datetime import timedelta
import jwt
from packages.shared.security import (
    hash_password,
    verify_password,
    hash_followup_code,
    verify_followup_code,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_password_hashing():
    password = "SeguridadPolicial2026!"
    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$argon2")
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_followup_code_hmac():
    pin = "123456"
    secret_key = "test_server_hmac_secret"

    hashed = hash_followup_code(pin, secret_key)
    assert len(hashed) == 64  # SHA256 hex length
    assert verify_followup_code(pin, hashed, secret_key) is True
    assert verify_followup_code("654321", hashed, secret_key) is False
    assert verify_followup_code(pin, hashed, "wrong_secret_key") is False


def test_jwt_tokens():
    data = {"sub": "officer-uuid-123", "role": "admin"}
    secret_key = "test_jwt_secret"

    # Access Token
    access_token = create_access_token(data, secret_key, expires_delta=timedelta(minutes=15))
    decoded = decode_token(access_token, secret_key)
    assert decoded["sub"] == "officer-uuid-123"
    assert decoded["role"] == "admin"
    assert decoded["type"] == "access"

    # Refresh Token
    refresh_token = create_refresh_token(data, secret_key, expires_delta=timedelta(days=7))
    decoded_refresh = decode_token(refresh_token, secret_key)
    assert decoded_refresh["sub"] == "officer-uuid-123"
    assert decoded_refresh["type"] == "refresh"

    # Expired token
    expired_token = create_access_token(data, secret_key, expires_delta=timedelta(seconds=-1))
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(expired_token, secret_key)

    # Invalid secret key
    with pytest.raises(jwt.InvalidSignatureError):
        decode_token(access_token, "different_secret")
