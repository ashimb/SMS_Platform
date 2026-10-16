"""Auth module constants."""

from __future__ import annotations

from typing import Final

INVALID_CREDENTIALS_MESSAGE: Final = "Incorrect email or password."
SESSION_INVALID_MESSAGE: Final = "Your session is invalid or has expired."

REVOKE_REASON_LOGOUT: Final = "logout"
REVOKE_REASON_REUSE: Final = "reuse_detected"
REVOKE_REASON_ROTATED: Final = "rotated"
REVOKE_REASON_USER_INACTIVE: Final = "user_inactive"
