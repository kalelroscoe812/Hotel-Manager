import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

SECRET_KEY = os.getenv("SECRET_KEY", "hotel-manager-production-secret-key-capstone-2026")
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days


def hash_password(password: str) -> str:
    """Hash a password securely using PBKDF2 with SHA-256."""
    salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Verify a plain password against a stored PBKDF2 hash."""
    if not hashed_password:
        return False
    try:
        method, salt, key = hashed_password.split("$")
        algo, iterations_str = method.split(":")[1], method.split(":")[2]
        iterations = int(iterations_str)
        derived = hashlib.pbkdf2_hmac(
            algo,
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(derived.hex(), key)
    except Exception:
        return False


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_access_token(user_id: int, username: str, role: str, hotel_id: int | None = None) -> str:
    """Create a signed, tamper-proof access token containing user session claims."""
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "hotel_id": hotel_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
    }
    raw_payload = _b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        raw_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64_encode(signature)
    return f"{raw_payload}.{sig_b64}"


def verify_access_token(token: str) -> dict[str, Any] | None:
    """Verify signature and expiration of an access token."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        raw_payload, sig_b64 = parts
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            raw_payload.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        actual_sig = _b64_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(_b64_decode(raw_payload).decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None
