"""CMS module: public surface (skeleton).

Scope: Website pages and blocks, content types, menus, SEO, publishing workflow, media consent
gating.
Requirements: FR-CMS-001 to FR-CMS-011, FR-MED-003, FR-MED-004 (FRD).
"""

from app.modules.cms.router import router
from app.modules.cms.service import CmsService

__all__ = ["CmsService", "router"]
