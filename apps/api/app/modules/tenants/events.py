"""Tenants domain events (names only; payloads carry ids, never PII)."""

from __future__ import annotations

from typing import Final

TENANT_CREATED: Final = "tenants.tenant.created"
TENANT_SETTINGS_UPDATED: Final = "tenants.settings.updated"
