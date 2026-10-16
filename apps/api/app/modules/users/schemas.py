"""Users API schemas. Secrets, hashes, and lockout internals are never part of a response."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.common.schemas import InputModel, OutputModel
from app.common.validators import PersonName


class UserOut(OutputModel):
    id: UUID
    email: str
    full_name: str
    status: str
    mfa_enabled: bool
    last_login_at: datetime | None
    created_at: datetime


class UserUpdate(InputModel):
    full_name: PersonName | None = Field(default=None)
