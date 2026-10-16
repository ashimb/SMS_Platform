"""Auth API schemas.

The access token is returned in the response body and must be kept in client memory only
(never localStorage/sessionStorage). The refresh token is never in a body: it is set as an
HttpOnly, Secure, SameSite cookie scoped to the auth path.
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import Field

from app.common.schemas import InputModel, OutputModel
from app.common.validators import EmailStr


class LoginRequest(InputModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(OutputModel):
    status: Literal["ok"] = "ok"
    access_token: str
    token_type: Literal["bearer"] = "bearer"  # noqa: S105 - OAuth2 token type, not a secret
    expires_in: int


class MfaRequiredResponse(OutputModel):
    status: Literal["mfa_required"] = "mfa_required"
    mfa_token: str
    expires_in: int


class MfaChallengeRequest(InputModel):
    mfa_token: str = Field(min_length=20, max_length=2048)
    code: str = Field(pattern=r"^\d{6}$")


class MfaEnrolResponse(OutputModel):
    otpauth_uri: str
    qr_svg: str


class MfaVerifyRequest(InputModel):
    code: str = Field(pattern=r"^\d{6}$")


class MeResponse(OutputModel):
    id: UUID
    tenant_id: UUID
    email: str
    full_name: str
    mfa_enabled: bool
    roles: list[str]
    permissions: list[str]
