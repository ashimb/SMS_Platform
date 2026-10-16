"""Authentication service: login, MFA, refresh rotation with reuse detection, logout.

Security properties (FRD FR-AUTH-001, FR-SEC-002/005/008):
- Unknown email, wrong password, inactive and locked accounts all get the same 401 and the same
  Argon2 verification cost (no account enumeration).
- After `lockout_threshold` consecutive failures the account is locked for `lockout_minutes`;
  failures are committed before the error is raised.
- Refresh tokens rotate on every use. Re-using a rotated token revokes the whole family and the
  session's access tokens (via a Redis revocation key checked on every request).
"""

from __future__ import annotations

import hashlib
import io
from dataclasses import dataclass
from datetime import timedelta
from typing import NoReturn
from uuid import UUID

import qrcode
import qrcode.image.svg
import redis
import structlog
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.deps import Principal, revoked_session_key
from app.core.errors import ConflictError, UnauthorizedError, ValidationFailedError
from app.core.middleware.audit_context import get_audit_context
from app.core.security import (
    TokenError,
    create_token,
    decode_token,
    decrypt_secret,
    encrypt_secret,
    generate_refresh_token,
    generate_totp_secret,
    hash_password,
    hash_refresh_token,
    new_session_id,
    password_needs_rehash,
    totp_provisioning_uri,
    verify_password,
    verify_totp,
)
from app.core.tenancy import TenantContext
from app.db.base import utcnow
from app.db.uow import UnitOfWork
from app.modules.audit import AuditService
from app.modules.auth.constants import (
    INVALID_CREDENTIALS_MESSAGE,
    REVOKE_REASON_LOGOUT,
    REVOKE_REASON_REUSE,
    REVOKE_REASON_ROTATED,
    REVOKE_REASON_USER_INACTIVE,
    SESSION_INVALID_MESSAGE,
)
from app.modules.auth.models import RefreshToken
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.auth.schemas import MeResponse, MfaEnrolResponse
from app.modules.rbac import RbacService
from app.modules.users import User, UserService

logger = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class IssuedTokens:
    access_token: str
    access_expires_in: int
    refresh_token: str
    refresh_expires_in: int
    session_id: UUID


@dataclass(frozen=True, slots=True)
class MfaRequired:
    mfa_token: str
    expires_in: int


def _identifier_fingerprint(email: str) -> str:
    """Stable, non-reversible reference to a login identifier for audit records."""
    return hashlib.sha256(email.strip().lower().encode()).hexdigest()[:16]


class AuthService:
    def __init__(
        self,
        uow: UnitOfWork,
        tenant: TenantContext,
        settings: Settings,
        redis_client: redis.Redis | None,
    ) -> None:
        self.uow = uow
        self.tenant = tenant
        self.settings = settings
        self.redis = redis_client
        self.users = UserService(uow, tenant)
        self.rbac = RbacService(uow, tenant)
        self.tokens = RefreshTokenRepository(uow.session, tenant)
        self.audit = AuditService(uow.session, tenant)

    # ---- Login ----------------------------------------------------------------------------------

    def login(self, email: str, password: str) -> IssuedTokens | MfaRequired:
        user = self.users.find_by_email(email)
        password_ok = verify_password(password, user.password_hash if user else None)

        if user is None:
            self._fail("auth.login.failed", None, email, reason="unknown_identifier")

        if not user.is_active:
            self._fail("auth.login.failed", user, email, reason="inactive")
        if self.users.is_locked(user):
            self._fail("auth.login.failed", user, email, reason="locked")
        if not password_ok:
            locked = self.users.record_failed_login(
                user,
                threshold=self.settings.lockout_threshold,
                lock_minutes=self.settings.lockout_minutes,
            )
            if locked:
                self.audit.record("auth.account.locked", entity_type="user", entity_id=user.id)
            self._fail("auth.login.failed", user, email, reason="bad_password")

        new_hash = (
            hash_password(password)
            if user.password_hash and password_needs_rehash(user.password_hash)
            else None
        )

        if user.mfa_enabled:
            # Password step passed; lockout counters reset only after the second factor.
            mfa_token, _ = create_token(
                subject=user.id, tenant_id=self.tenant.tenant_id, kind="mfa",
                settings=self.settings,
            )  # fmt: skip
            if new_hash:
                # The password is already proven, so the upgraded hash can be stored now.
                self.users.set_password_hash(user, new_hash)
            self.audit.record("auth.login.mfa_challenge", entity_type="user", entity_id=user.id)
            self.uow.commit()
            return MfaRequired(mfa_token=mfa_token, expires_in=self.settings.mfa_token_ttl_seconds)

        self.users.record_successful_login(user, new_password_hash=new_hash)
        issued = self._issue(user)
        self.audit.record(
            "auth.login.succeeded", entity_type="user", entity_id=user.id, actor_user_id=user.id
        )
        self.uow.commit()
        return issued

    def complete_mfa(self, mfa_token: str, code: str) -> IssuedTokens:
        try:
            claims = decode_token(mfa_token, expected_type="mfa", settings=self.settings)
        except TokenError:
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN") from None
        if claims.tid != self.tenant.tenant_id:
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")
        user = self.users.find_by_id(claims.sub)
        if (
            user is None
            or not user.is_active
            or not user.mfa_enabled
            or not user.mfa_secret_encrypted
        ):
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")
        if self.users.is_locked(user):
            raise UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, code="INVALID_CREDENTIALS")

        step = verify_totp(
            decrypt_secret(user.mfa_secret_encrypted, self.settings),
            code,
            last_used_step=user.mfa_last_used_step,
        )
        if step is None:
            self.users.record_failed_login(
                user,
                threshold=self.settings.lockout_threshold,
                lock_minutes=self.settings.lockout_minutes,
            )
            self.audit.record("auth.mfa.failed", entity_type="user", entity_id=user.id)
            self.uow.commit()
            raise UnauthorizedError("The verification code is incorrect.", code="MFA_INVALID")

        self.users.record_mfa_step(user, step)
        self.users.record_successful_login(user)
        issued = self._issue(user)
        self.audit.record(
            "auth.login.succeeded", entity_type="user", entity_id=user.id, actor_user_id=user.id,
            after={"mfa": True},
        )  # fmt: skip
        self.uow.commit()
        return issued

    # ---- Refresh / logout -----------------------------------------------------------------------

    def refresh(self, raw_token: str | None) -> IssuedTokens:
        if not raw_token:
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")
        record = self.tokens.get_by_hash(hash_refresh_token(raw_token))
        if record is None:
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")

        if record.used_at is not None or record.revoked_at is not None:
            # Reuse of a rotated (or revoked) token: assume theft, kill the whole session.
            self.tokens.revoke_family(record.family_id, REVOKE_REASON_REUSE)
            self._revoke_session(record.family_id)
            self.audit.record(
                "auth.refresh.reuse_detected", entity_type="user", entity_id=record.user_id,
                actor_user_id=record.user_id, after={"session_id": str(record.family_id)},
            )  # fmt: skip
            self.uow.commit()
            logger.warning("security.refresh_reuse", session_id=str(record.family_id))
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")

        if record.expires_at <= utcnow():
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")

        user = self.users.find_by_id(record.user_id)
        if user is None or not user.is_active:
            self.tokens.revoke_family(record.family_id, REVOKE_REASON_USER_INACTIVE)
            self.uow.commit()
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")

        self.tokens.update(record, {"used_at": utcnow(), "revoked_reason": REVOKE_REASON_ROTATED})
        issued = self._issue(user, family_id=record.family_id, parent_id=record.id)
        self.uow.commit()
        return issued

    def logout(self, raw_token: str | None, principal: Principal | None = None) -> None:
        session_id: UUID | None = principal.session_id if principal else None
        user_id: UUID | None = principal.user_id if principal else None
        if raw_token:
            record = self.tokens.get_by_hash(hash_refresh_token(raw_token))
            if record is not None:
                session_id = record.family_id
                user_id = record.user_id
        if session_id is not None:
            self.tokens.revoke_family(session_id, REVOKE_REASON_LOGOUT)
            self._revoke_session(session_id)
            self.audit.record(
                "auth.logout", entity_type="user", entity_id=user_id, actor_user_id=user_id
            )
        self.uow.commit()

    # ---- Me / MFA enrolment ---------------------------------------------------------------------

    def me(self, principal: Principal) -> MeResponse:
        user = self._active_user(principal.user_id)
        return MeResponse(
            id=user.id,
            tenant_id=user.tenant_id,
            email=user.email,
            full_name=user.full_name,
            mfa_enabled=user.mfa_enabled,
            roles=sorted(principal.roles),
            permissions=sorted(principal.permissions),
        )

    def start_mfa_enrolment(self, principal: Principal) -> MfaEnrolResponse:
        user = self._active_user(principal.user_id)
        if user.mfa_enabled:
            raise ConflictError(
                "Two-step verification is already enabled.", code="MFA_ALREADY_ENABLED"
            )
        secret = generate_totp_secret()
        self.users.set_mfa_pending_secret(user, encrypt_secret(secret, self.settings))
        self.uow.commit()
        uri = totp_provisioning_uri(
            secret, account_name=user.email, issuer=self.settings.totp_issuer
        )
        image = qrcode.make(uri, image_factory=qrcode.image.svg.SvgPathImage)
        buffer = io.BytesIO()
        image.save(buffer)
        return MfaEnrolResponse(otpauth_uri=uri, qr_svg=buffer.getvalue().decode())

    def confirm_mfa_enrolment(self, principal: Principal, code: str) -> None:
        user = self._active_user(principal.user_id)
        if not user.mfa_pending_secret_encrypted:
            raise ValidationFailedError("Start enrolment first.", code="MFA_NOT_STARTED")
        step = verify_totp(decrypt_secret(user.mfa_pending_secret_encrypted, self.settings), code)
        if step is None:
            raise ValidationFailedError("The verification code is incorrect.", code="MFA_INVALID")
        self.users.activate_mfa(user, used_step=step)
        self.audit.record("auth.mfa.enrolled", entity_type="user", entity_id=user.id)
        # TODO(auth hardening): generate and return one-time recovery codes (FRD FR-AUTH-003).
        self.uow.commit()

    # ---- Internals ------------------------------------------------------------------------------

    def _issue(
        self, user: User, *, family_id: UUID | None = None, parent_id: UUID | None = None
    ) -> IssuedTokens:
        session_id = family_id or new_session_id()
        access_token, _ = create_token(
            subject=user.id,
            tenant_id=self.tenant.tenant_id,
            kind="access",
            session_id=session_id,
            settings=self.settings,
        )
        raw_refresh = generate_refresh_token()
        context = get_audit_context()
        self.tokens.add(
            RefreshToken(
                user_id=user.id,
                family_id=session_id,
                parent_id=parent_id,
                token_hash=hash_refresh_token(raw_refresh),
                expires_at=utcnow() + timedelta(seconds=self.settings.refresh_token_ttl_seconds),
                ip=context.ip,
                user_agent=context.user_agent,
            )
        )
        return IssuedTokens(
            access_token=access_token,
            access_expires_in=self.settings.access_token_ttl_seconds,
            refresh_token=raw_refresh,
            refresh_expires_in=self.settings.refresh_token_ttl_seconds,
            session_id=session_id,
        )

    def _revoke_session(self, session_id: UUID) -> None:
        """Block access tokens of this session until they would have expired anyway."""
        if self.redis is None:
            return
        try:
            self.redis.set(
                revoked_session_key(self.tenant, session_id),
                "1",
                ex=self.settings.access_token_ttl_seconds + 60,
            )
        except redis.RedisError:
            logger.error("session_revocation_failed", session_id=str(session_id))
            raise

    def _fail(self, action: str, user: User | None, email: str, *, reason: str) -> NoReturn:
        self.audit.record(
            action,
            entity_type="user",
            entity_id=user.id if user else None,
            after={"reason": reason, "identifier": _identifier_fingerprint(email)},
        )
        self.uow.commit()
        raise UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, code="INVALID_CREDENTIALS")

    def _active_user(self, user_id: UUID) -> User:
        user = self.users.find_by_id(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError(SESSION_INVALID_MESSAGE, code="INVALID_TOKEN")
        return user


def load_principal(
    session: Session, tenant: TenantContext, user_id: UUID, session_id: UUID | None
) -> Principal | None:
    """PrincipalLoader registered on the app: active user + roles + permissions in this tenant."""
    uow = _SessionBoundUow(session)
    user = UserService(uow, tenant).find_by_id(user_id)
    if user is None or not user.is_active:
        return None
    rbac = RbacService(uow, tenant)
    return Principal(
        user_id=user.id,
        tenant_id=tenant.tenant_id,
        session_id=session_id,
        roles=rbac.role_codes_for_user(user.id),
        permissions=rbac.permissions_for_user(user.id),
    )


class _SessionBoundUow(UnitOfWork):
    """Adapter exposing an existing request session through the UnitOfWork interface."""

    def __init__(self, session: Session) -> None:
        self._bound = session

    @property
    def session(self) -> Session:
        return self._bound
