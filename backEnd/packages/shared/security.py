import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
_pwd_context = None


def get_pwd_context():
    global _pwd_context
    if _pwd_context is None:
        from passlib.context import CryptContext
        _pwd_context = CryptContext(
            schemes=["argon2"],
            deprecated="auto",
            argon2__time_cost=2,
            argon2__memory_cost=65536,
            argon2__parallelism=2,
        )
    return _pwd_context


def hash_password(password: str) -> str:
    """Genera hash seguro de contraseña usando Argon2id."""
    return get_pwd_context().hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto claro coincide con el hash Argon2id."""
    return get_pwd_context().verify(plain_password, hashed_password)


def hash_followup_code(pin_or_code: str, secret_key: str) -> str:
    """Genera hash HMAC-SHA256 del código de seguimiento ciudadano con sal del servidor."""
    key = secret_key.encode("utf-8")
    message = pin_or_code.strip().encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def verify_followup_code(pin_or_code: str, hashed_code: str, secret_key: str) -> bool:
    """Verifica el código secreto de seguimiento contra el hash almacenado usando tiempo constante."""
    expected_hash = hash_followup_code(pin_or_code, secret_key)
    return hmac.compare_digest(expected_hash, hashed_code)


def create_access_token(
    data: Dict[str, Any],
    secret_key: str,
    algorithm: str = "HS256",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Crea un token JWT de acceso firmado."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=15)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access",
    })
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def create_refresh_token(
    data: Dict[str, Any],
    secret_key: str,
    algorithm: str = "HS256",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Crea un token JWT de refresco firmado."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh",
    })
    return jwt.encode(to_encode, secret_key, algorithm=algorithm)


def decode_token(token: str, secret_key: str, algorithm: str = "HS256") -> Dict[str, Any]:
    """Decodifica y valida la firma y expiración de un token JWT."""
    return jwt.decode(token, secret_key, algorithms=[algorithm])
