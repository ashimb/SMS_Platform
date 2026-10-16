"""CMS policies (skeleton).

Scope: Website pages and blocks, content types, menus, SEO, publishing workflow, media consent
gating.
Requirements: FR-CMS-001 to FR-CMS-011, FR-MED-003, FR-MED-004 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class CmsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
