"""Application settings (pydantic-settings).

All configuration comes from environment variables (optionally a local `.env` file). In
`staging`/`production` the app refuses to start when secrets are missing or still set to the
`change-me` placeholders from `.env.example`. In `development`/`test`, missing signing and
encryption keys are replaced with ephemeral keys generated at startup (tokens and MFA secrets do
not survive a restart).
"""

from __future__ import annotations

import base64
import secrets
from functools import lru_cache
from pathlib import Path
from typing import Literal, Self
from uuid import UUID

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

Environment = Literal["development", "test", "staging", "production"]

#: Fixed UUID of the single launch tenant. Override with DEFAULT_TENANT_ID.
DEFAULT_TENANT_UUID = UUID("01920000-0000-7000-8000-000000000001")

_PLACEHOLDER_MARKER = "change-me"


class Settings(BaseSettings):
    """Typed, validated runtime configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- General
    app_env: Environment = "development"
    app_name: str = "SchoolPlatform API"
    log_level: Literal["debug", "info", "warning", "error"] = "info"
    api_prefix: str = "/api/v1"
    sentry_dsn: SecretStr | None = None

    # ---- Database (MySQL 8 via PyMySQL)
    db_host: str = "127.0.0.1"
    db_port: int = 3306
    db_name: str = "school_platform"
    db_user: str = "school_app"
    db_password: SecretStr = SecretStr("")
    db_pool_size: int = Field(default=10, ge=1, le=100)
    db_max_overflow: int = Field(default=10, ge=0, le=100)
    db_echo: bool = False

    # ---- Redis
    redis_host: str = "127.0.0.1"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: SecretStr = SecretStr("")

    # ---- Object storage (S3-compatible; MinIO in dev)
    s3_endpoint_url: str | None = None
    s3_region: str = "ap-south-1"
    s3_access_key_id: SecretStr | None = None
    s3_secret_access_key: SecretStr | None = None
    s3_bucket_prefix: str = "school-platform"

    # ---- Tenancy
    default_tenant_id: UUID = DEFAULT_TENANT_UUID
    default_tenant_slug: str = "default"
    tenant_resolution: Literal["default", "host"] = "default"

    # ---- JWT: EdDSA signatures with an Ed25519 key
    jwt_algorithm: Literal["EdDSA"] = "EdDSA"
    jwt_signing_key: SecretStr | None = None
    jwt_signing_key_file: Path | None = None
    jwt_issuer: str = "school-platform"
    jwt_audience: str = "school-platform-portal"
    access_token_ttl_seconds: int = Field(default=600, ge=60, le=900)
    refresh_token_ttl_seconds: int = Field(default=12 * 3600, ge=300, le=30 * 24 * 3600)
    mfa_token_ttl_seconds: int = Field(default=300, ge=60, le=600)

    # ---- MFA secret encryption (Fernet key, urlsafe base64 of 32 bytes)
    mfa_encryption_key: SecretStr | None = None
    totp_issuer: str = "SchoolPlatform"

    # ---- Login protection
    lockout_threshold: int = Field(default=5, ge=3, le=20)
    lockout_minutes: int = Field(default=15, ge=1, le=24 * 60)

    # ---- Cookies (refresh token only; access tokens live in client memory)
    refresh_cookie_name: str = "__Secure-sp_rt"
    refresh_cookie_path: str = "/api/v1/auth"
    cookie_secure: bool = True
    cookie_samesite: Literal["strict", "lax"] = "strict"
    cookie_domain: str | None = None
    csrf_header_name: str = "X-SP-CSRF"

    # ---- CORS (portal is same-origin; only set for exceptional dev setups)
    cors_origins: list[str] = Field(default_factory=list)

    # ---- Rate limiting (requests per window, per client IP and tenant)
    rate_limit_enabled: bool = True
    rate_limit_default: int = Field(default=120, ge=1)
    rate_limit_default_window_seconds: int = Field(default=60, ge=1)
    rate_limit_auth: int = Field(default=10, ge=1)
    rate_limit_auth_window_seconds: int = Field(default=60, ge=1)

    # ---- Validators -----------------------------------------------------------------------------

    @field_validator("cors_origins")
    @classmethod
    def _no_wildcard_origins(cls, value: list[str]) -> list[str]:
        if any(origin.strip() == "*" for origin in value):
            raise ValueError("CORS_ORIGINS must list explicit origins; '*' is not allowed")
        return value

    @model_validator(mode="after")
    def _enforce_secure_configuration(self) -> Self:
        if not self.is_deployed:
            return self

        problems: list[str] = []
        required_secrets = {
            "DB_PASSWORD": self.db_password,
            "REDIS_PASSWORD": self.redis_password,
            "MFA_ENCRYPTION_KEY": self.mfa_encryption_key,
        }
        for name, value in required_secrets.items():
            secret = value.get_secret_value() if value is not None else ""
            if not secret:
                problems.append(f"{name} is required")
            elif _PLACEHOLDER_MARKER in secret:
                problems.append(f"{name} still has the placeholder value")
        if self.jwt_signing_key is None and self.jwt_signing_key_file is None:
            problems.append("JWT_SIGNING_KEY or JWT_SIGNING_KEY_FILE is required")
        if self.jwt_signing_key_file is not None and not self.jwt_signing_key_file.is_file():
            problems.append(f"JWT_SIGNING_KEY_FILE does not exist: {self.jwt_signing_key_file}")
        if not self.cookie_secure:
            problems.append("COOKIE_SECURE must be true outside development")
        if self.db_echo:
            problems.append("DB_ECHO must be false outside development (it logs SQL parameters)")
        if problems:
            raise ValueError("Insecure configuration: " + "; ".join(problems))
        return self

    # ---- Derived values -------------------------------------------------------------------------

    @property
    def is_deployed(self) -> bool:
        """True for staging and production."""
        return self.app_env in ("staging", "production")

    @property
    def docs_enabled(self) -> bool:
        """OpenAPI docs are served only outside production."""
        return self.app_env != "production"

    @property
    def database_url(self) -> URL:
        """SQLAlchemy URL; credentials are escaped by URL.create."""
        return URL.create(
            "mysql+pymysql",
            username=self.db_user,
            password=self.db_password.get_secret_value() or None,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
            query={"charset": "utf8mb4"},
        )

    @property
    def redis_url(self) -> str:
        password = self.redis_password.get_secret_value()
        auth = f":{password}@" if password else ""
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    def signing_key_pem(self) -> bytes:
        """PEM of the Ed25519 private key used to sign JWTs."""
        if self.jwt_signing_key is not None:
            return self.jwt_signing_key.get_secret_value().encode()
        if self.jwt_signing_key_file is not None:
            return self.jwt_signing_key_file.read_bytes()
        return _ephemeral_signing_key_pem()

    def mfa_key(self) -> bytes:
        """Fernet key for encrypting TOTP secrets at rest."""
        if self.mfa_encryption_key is not None:
            return self.mfa_encryption_key.get_secret_value().encode()
        return _ephemeral_fernet_key()


@lru_cache(maxsize=1)
def _ephemeral_signing_key_pem() -> bytes:
    return Ed25519PrivateKey.generate().private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )


@lru_cache(maxsize=1)
def _ephemeral_fernet_key() -> bytes:
    return base64.urlsafe_b64encode(secrets.token_bytes(32))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Process-wide settings, validated once."""
    return Settings()
