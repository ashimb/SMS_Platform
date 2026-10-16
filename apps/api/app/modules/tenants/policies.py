"""Tenants policies.

Tenant settings are protected by route-level permissions only (there is one settings object per
tenant). Resource-level rules arrive with tenant administration in v2.
"""

from __future__ import annotations

from app.core.permissions import Policy
from app.modules.tenants.models import TenantSettings


class TenantSettingsPolicy(Policy[TenantSettings]):
    """Deny-by-default placeholder; no resource-level actions defined yet."""
