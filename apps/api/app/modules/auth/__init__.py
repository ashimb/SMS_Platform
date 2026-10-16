"""Auth module: public surface."""

from app.modules.auth.router import router
from app.modules.auth.service import AuthService, load_principal

__all__ = ["AuthService", "load_principal", "router"]
