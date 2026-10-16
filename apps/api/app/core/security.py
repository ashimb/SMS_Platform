"""Cryptographic primitives: password hashing, JWTs, refresh tokens, TOTP.

- Passwords: Argon2id (argon2-cffi defaults, RFC 9106 low-memory profile), with rehash detection.
- JWTs: EdDSA (Ed25519) signatures, strict algorithm allow-list, required claims
  (`sub`, `tid`, `jti`, `exp`, `iat`, `type`, `iss`, `aud`).
- Refresh tokens: 256-bit random strings; only their SHA-256 hash is stored.
- TOTP: RFC 6238 (6 digits, 30 s step, ±1 step tolerance); secrets encrypted at rest (Fernet).
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from typing import Any, Literal
from urllib.parse import quote
from uuid import UUID, uuid7

import jwt
import pyotp
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from app.core.config import Settings, get_settings

TokenType = Literal["access", "mfa"]

_password_hasher = PasswordHasher()
# Verified when the user does not exist, so response timing does not reveal account existence.
_DUMMY_HASH = _password_hasher.hash(secrets.token_urlsafe(16))


# ---- Passwords ----------------------------------------------------------------------------------


def hash_password(password: str) -> str:
    """Argon2id hash of `password`."""
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    """Constant-effort verification. A missing hash still costs one Argon2 verification."""
    try:
        return _password_hasher.verify(password_hash or _DUMMY_HASH, password) and bool(
            password_hash
        )
    except VerifyMismatchError, VerificationError, InvalidHashError:
        return False


def password_needs_rehash(password_hash: str) -> bool:
    """True when the stored hash uses outdated parameters and should be upgraded on login."""
    try:
        return _password_hasher.check_needs_rehash(password_hash)
    except InvalidHashError:
        return True


# ---- JWT ----------------------------------------------------------------------------------------


class TokenError(Exception):
    """Raised for any invalid, expired, or mistyped token. Never carries token contents."""


@dataclass(frozen=True, slots=True)
class TokenClaims:
    """Validated JWT claims."""

    sub: UUID
    tid: UUID
    jti: str
    type: TokenType
    sid: UUID | None
    exp: datetime
    iat: datetime


@lru_cache(maxsize=4)
def _keys(pem: bytes) -> tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    private_key = serialization.load_pem_private_key(pem, password=None)
    if not isinstance(private_key, Ed25519PrivateKey):
        raise ValueError("JWT signing key must be an Ed25519 private key")
    return private_key, private_key.public_key()


def create_token(
    *,
    subject: UUID,
    tenant_id: UUID,
    kind: TokenType,
    session_id: UUID | None = None,
    ttl_seconds: int | None = None,
    settings: Settings | None = None,
) -> tuple[str, TokenClaims]:
    """Sign a JWT. Returns the encoded token and its claims."""
    settings = settings or get_settings()
    if ttl_seconds is None:
        ttl_seconds = (
            settings.access_token_ttl_seconds
            if kind == "access"
            else settings.mfa_token_ttl_seconds
        )
    now = datetime.now(UTC)
    claims = TokenClaims(
        sub=subject,
        tid=tenant_id,
        jti=secrets.token_urlsafe(16),
        type=kind,
        sid=session_id,
        exp=now + timedelta(seconds=ttl_seconds),
        iat=now,
    )
    payload: dict[str, Any] = {
        "sub": str(claims.sub),
        "tid": str(claims.tid),
        "jti": claims.jti,
        "type": claims.type,
        "iat": int(claims.iat.timestamp()),
        "nbf": int(claims.iat.timestamp()),
        "exp": int(claims.exp.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }
    if claims.sid is not None:
        payload["sid"] = str(claims.sid)
    private_key, _ = _keys(settings.signing_key_pem())
    token = jwt.encode(payload, private_key, algorithm=settings.jwt_algorithm)
    return token, claims


def decode_token(
    token: str, *, expected_type: TokenType, settings: Settings | None = None
) -> TokenClaims:
    """Verify signature, algorithm, issuer, audience, expiry, and type. Raises TokenError."""
    settings = settings or get_settings()
    _, public_key = _keys(settings.signing_key_pem())
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require": ["sub", "tid", "jti", "exp", "iat", "type", "iss", "aud"]},
            leeway=5,
        )
    except jwt.PyJWTError as exc:
        raise TokenError("invalid token") from exc

    if payload.get("type") != expected_type:
        raise TokenError("unexpected token type")
    try:
        sid = payload.get("sid")
        return TokenClaims(
            sub=UUID(str(payload["sub"])),
            tid=UUID(str(payload["tid"])),
            jti=str(payload["jti"]),
            type=expected_type,
            sid=UUID(str(sid)) if sid else None,
            exp=datetime.fromtimestamp(int(payload["exp"]), UTC),
            iat=datetime.fromtimestamp(int(payload["iat"]), UTC),
        )
    except (KeyError, ValueError, TypeError) as exc:
        raise TokenError("malformed claims") from exc


# ---- Refresh tokens -----------------------------------------------------------------------------


def generate_refresh_token() -> str:
    """256-bit URL-safe random token (sent to the client once, in a cookie)."""
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    """SHA-256 hex digest stored in the database instead of the token."""
    return hashlib.sha256(token.encode()).hexdigest()


def new_session_id() -> UUID:
    """Identifier of a refresh-token family (one sign-in session)."""
    return uuid7()


def constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode(), b.encode())


# ---- TOTP (MFA) ---------------------------------------------------------------------------------


def generate_totp_secret() -> str:
    """160-bit base32 secret."""
    return pyotp.random_base32(length=32)


def totp_provisioning_uri(secret: str, *, account_name: str, issuer: str) -> str:
    """otpauth:// URI for authenticator apps (rendered as a QR code client-side or server-side)."""
    return str(pyotp.TOTP(secret).provisioning_uri(name=quote(account_name), issuer_name=issuer))


def verify_totp(
    secret: str, code: str, *, last_used_step: int | None = None, at: float | None = None
) -> int | None:
    """Verify a 6-digit code with ±1 step tolerance.

    Returns the matched time step (store it to block replay), or None if invalid or replayed.
    """
    if not (len(code) == 6 and code.isdigit()):
        return None
    totp = pyotp.TOTP(secret)
    now = time.time() if at is None else at
    current_step = int(now // totp.interval)
    for step in (current_step - 1, current_step, current_step + 1):
        if last_used_step is not None and step <= last_used_step:
            continue
        expected = totp.at(step * totp.interval)
        if hmac.compare_digest(expected, code):
            return step
    return None


def encrypt_secret(plaintext: str, settings: Settings | None = None) -> str:
    """Encrypt a small secret (e.g. TOTP seed) with the configured Fernet key."""
    settings = settings or get_settings()
    return Fernet(settings.mfa_key()).encrypt(plaintext.encode()).decode()


def decrypt_secret(ciphertext: str, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    try:
        return Fernet(settings.mfa_key()).decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise TokenError("cannot decrypt secret") from exc
