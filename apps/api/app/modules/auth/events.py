"""Auth domain/security events."""

from __future__ import annotations

from typing import Final

LOGIN_SUCCEEDED: Final = "auth.login.succeeded"
LOGIN_FAILED: Final = "auth.login.failed"
ACCOUNT_LOCKED: Final = "auth.account.locked"
REFRESH_REUSE_DETECTED: Final = "auth.refresh.reuse_detected"
LOGOUT: Final = "auth.logout"
MFA_ENROLLED: Final = "auth.mfa.enrolled"
