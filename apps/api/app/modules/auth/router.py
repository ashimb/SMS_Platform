"""Auth HTTP routes.

Cookie handling is an HTTP concern and lives here; token logic lives in the service.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response, status

from app.common.schemas import error_responses
from app.core.config import Settings, get_settings
from app.core.deps import (
    Principal,
    PrincipalDep,
    SettingsDep,
    TenantDep,
    UowDep,
    get_optional_principal,
    require_csrf_header,
)
from app.core.rate_limit import auth_limiter
from app.modules.auth.schemas import (
    LoginRequest,
    MeResponse,
    MfaChallengeRequest,
    MfaEnrolResponse,
    MfaRequiredResponse,
    MfaVerifyRequest,
    TokenResponse,
)
from app.modules.auth.service import AuthService, IssuedTokens, MfaRequired

router = APIRouter(prefix="/auth", tags=["auth"])

_REFRESH_COOKIE = get_settings().refresh_cookie_name


def get_service(
    request: Request, uow: UowDep, tenant: TenantDep, settings: SettingsDep
) -> AuthService:
    return AuthService(uow, tenant, settings, getattr(request.app.state, "redis", None))


ServiceDep = Annotated[AuthService, Depends(get_service)]
RefreshCookie = Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)]


def _set_refresh_cookie(response: Response, issued: IssuedTokens, settings: Settings) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=issued.refresh_token,
        max_age=issued.refresh_expires_in,
        path=settings.refresh_cookie_path,
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_samesite,
    )


def _clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_samesite,
    )


def _token_response(issued: IssuedTokens) -> TokenResponse:
    return TokenResponse(access_token=issued.access_token, expires_in=issued.access_expires_in)


@router.post(
    "/login",
    response_model=TokenResponse | MfaRequiredResponse,
    dependencies=[Depends(auth_limiter("auth_login"))],
    responses=error_responses(401, 422, 429),
)
def login(
    body: LoginRequest, response: Response, service: ServiceDep, settings: SettingsDep
) -> TokenResponse | MfaRequiredResponse:
    result = service.login(body.email, body.password)
    if isinstance(result, MfaRequired):
        return MfaRequiredResponse(mfa_token=result.mfa_token, expires_in=result.expires_in)
    _set_refresh_cookie(response, result, settings)
    return _token_response(result)


@router.post(
    "/mfa/challenge",
    response_model=TokenResponse,
    dependencies=[Depends(auth_limiter("auth_mfa"))],
    responses=error_responses(401, 422, 429),
)
def mfa_challenge(
    body: MfaChallengeRequest, response: Response, service: ServiceDep, settings: SettingsDep
) -> TokenResponse:
    issued = service.complete_mfa(body.mfa_token, body.code)
    _set_refresh_cookie(response, issued, settings)
    return _token_response(issued)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    dependencies=[Depends(auth_limiter("auth_refresh")), Depends(require_csrf_header)],
    responses=error_responses(401, 403, 429),
)
def refresh(
    response: Response,
    service: ServiceDep,
    settings: SettingsDep,
    refresh_token: RefreshCookie = None,
) -> TokenResponse:
    issued = service.refresh(refresh_token)
    _set_refresh_cookie(response, issued, settings)
    return _token_response(issued)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_csrf_header)],
    responses=error_responses(403),
)
def logout(
    response: Response,
    service: ServiceDep,
    settings: SettingsDep,
    principal: Annotated[Principal | None, Depends(get_optional_principal)],
    refresh_token: RefreshCookie = None,
) -> Response:
    service.logout(refresh_token, principal)
    response.status_code = status.HTTP_204_NO_CONTENT
    _clear_refresh_cookie(response, settings)
    return response


@router.get("/me", response_model=MeResponse, responses=error_responses(401))
def me(principal: PrincipalDep, service: ServiceDep) -> MeResponse:
    return service.me(principal)


@router.post(
    "/mfa/totp/enrol",
    response_model=MfaEnrolResponse,
    dependencies=[Depends(auth_limiter("auth_mfa_enrol"))],
    responses=error_responses(401, 409, 429),
)
def start_mfa_enrolment(principal: PrincipalDep, service: ServiceDep) -> MfaEnrolResponse:
    return service.start_mfa_enrolment(principal)


@router.post(
    "/mfa/totp/verify",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(auth_limiter("auth_mfa_verify"))],
    responses=error_responses(401, 422, 429),
)
def confirm_mfa_enrolment(
    body: MfaVerifyRequest, principal: PrincipalDep, service: ServiceDep
) -> Response:
    service.confirm_mfa_enrolment(principal, body.code)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
