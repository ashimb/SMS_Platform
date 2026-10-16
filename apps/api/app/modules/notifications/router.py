"""Notifications HTTP routes (skeleton).

Scope: Notification engine: templates, channels (in-app, email, SMS, WhatsApp, web push),
preferences, quiet hours, delivery tracking.
Requirements: FR-COM-003, FR-COM-004, FR-COM-007, FR-COM-008, FR-COM-009 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/notifications", tags=["notifications"], dependencies=[Depends(default_limiter())]
)
