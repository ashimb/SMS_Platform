"""Users service: account management and the account operations used by authentication."""

from __future__ import annotations

from datetime import datetime, timedelta
from uuid import UUID

from app.common.pagination import PageParams, PageResult
from app.common.validators import check_password_policy, normalize_email, normalize_name
from app.core.deps import Principal
from app.core.errors import ConflictError, NotFoundError
from app.core.security import hash_password
from app.core.tenancy import TenantContext
from app.db.base import utcnow
from app.db.uow import UnitOfWork
from app.modules.audit import AuditService
from app.modules.users.models import User
from app.modules.users.policies import UserPolicy
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserOut, UserUpdate

#: Fields cleared when a pending MFA enrolment is confirmed.
_PENDING_SECRET_FIELDS = ("mfa_pending_secret_encrypted",)


class UserService:
    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
        self.users = UserRepository(uow.session, tenant)
        self.audit = AuditService(uow.session, tenant)
        self.policy = UserPolicy()

    # ---- API operations -------------------------------------------------------------------------

    def list_users(self, principal: Principal, params: PageParams) -> PageResult[UserOut]:
        self.policy.authorize(principal, "view")
        result = self.users.paginate(params, order_by=(User.full_name, User.id))
        return result.map(UserOut.model_validate)

    def get_user(self, principal: Principal, user_id: UUID) -> UserOut:
        user = self._get_or_404(user_id)
        self.policy.authorize(principal, "view", user)
        return UserOut.model_validate(user)

    def update_user(self, principal: Principal, user_id: UUID, data: UserUpdate) -> UserOut:
        user = self._get_or_404(user_id)
        self.policy.authorize(principal, "update", user)
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        if changes:
            before = {key: getattr(user, key) for key in changes}
            self.users.update(user, changes)
            self.audit.record(
                "users.user.updated", entity_type="user", entity_id=user.id,
                before=before, after=changes,
            )  # fmt: skip
        self.uow.commit()
        return UserOut.model_validate(user)

    # ---- Account administration (seeds, scripts, later the IAM screens) -----------------------

    def create_user(
        self, *, email: str, full_name: str, password: str | None, status: str = "active"
    ) -> User:
        email = normalize_email(email)
        if self.users.get_by_email(email) is not None:
            raise ConflictError("A user with this email already exists.", code="DUPLICATE_EMAIL")
        password_hash = None
        if password is not None:
            check_password_policy(password, context=(full_name, email.split("@")[0]))
            password_hash = hash_password(password)
        user = User(
            email=email,
            full_name=normalize_name(full_name),
            password_hash=password_hash,
            status=status,
            password_changed_at=utcnow() if password_hash else None,
        )
        self.users.add(user)
        self.audit.record("users.user.created", entity_type="user", entity_id=user.id)
        return user

    # ---- Operations used by the auth module --------------------------------------------------

    def find_by_email(self, email: str) -> User | None:
        try:
            normalized = normalize_email(email)
        except ValueError:
            return None
        return self.users.get_by_email(normalized)

    def find_by_id(self, user_id: UUID) -> User | None:
        return self.users.get(user_id)

    def is_locked(self, user: User, now: datetime | None = None) -> bool:
        now = now or utcnow()
        return user.locked_until is not None and user.locked_until > now

    def record_failed_login(self, user: User, *, threshold: int, lock_minutes: int) -> bool:
        """Count a failed login; lock the account at the threshold. Returns True if locked."""
        count = user.failed_login_count + 1
        if count >= threshold:
            self.users.update(
                user,
                {
                    "failed_login_count": 0,
                    "locked_until": utcnow() + timedelta(minutes=lock_minutes),
                },
            )
            return True
        self.users.update(user, {"failed_login_count": count})
        return False

    def record_successful_login(self, user: User, *, new_password_hash: str | None = None) -> None:
        values: dict[str, object] = {
            "failed_login_count": 0,
            "locked_until": None,
            "last_login_at": utcnow(),
        }
        if new_password_hash is not None:
            values["password_hash"] = new_password_hash
        self.users.update(user, values)

    def set_password_hash(self, user: User, password_hash: str) -> None:
        self.users.update(user, {"password_hash": password_hash})

    def set_mfa_pending_secret(self, user: User, encrypted_secret: str) -> None:
        self.users.update(user, {"mfa_pending_secret_encrypted": encrypted_secret})

    def activate_mfa(self, user: User, *, used_step: int) -> None:
        """Promote the pending TOTP secret to active and clear the pending slot."""
        values: dict[str, object] = dict.fromkeys(_PENDING_SECRET_FIELDS)
        values |= {
            "mfa_secret_encrypted": user.mfa_pending_secret_encrypted,
            "mfa_enabled": True,
            "mfa_last_used_step": used_step,
        }
        self.users.update(user, values)

    def record_mfa_step(self, user: User, step: int) -> None:
        self.users.update(user, {"mfa_last_used_step": step})

    def _get_or_404(self, user_id: UUID) -> User:
        user = self.users.get(user_id)
        if user is None:
            raise NotFoundError()
        return user
