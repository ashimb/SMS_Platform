import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField } from "@school-platform/ui";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { auth, useAuth } from "@/lib/auth-store.ts";
import { ROUTES, safeNextPath } from "@/shared/constants/routes.ts";

import { describeAuthError } from "../api/index.ts";
import { AuthErrorMessage } from "../components/AuthErrorMessage.tsx";
import { AuthHeading } from "../components/AuthHeading.tsx";
import { OtpInput } from "../components/OtpInput.tsx";
import { mfaSchema, type MfaValues } from "../schemas.ts";
import type { AuthErrorView } from "../types.ts";

/** Second sign-in step: 6-digit code from the user's authenticator app. */
export function MfaPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const pending = useAuth((state) => state.pendingMfa);
  const [error, setError] = useState<AuthErrorView | null>(null);
  const [attempt, setAttempt] = useState(0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MfaValues>({ resolver: zodResolver(mfaSchema), defaultValues: { code: "" } });

  const submit = handleSubmit(async ({ code }) => {
    setError(null);
    const result = await auth.verifyMfa(code);
    if (result.kind === "ok") {
      void navigate(next, { replace: true });
      return;
    }
    const view = result.kind === "error" ? describeAuthError(result.error) : null;
    if (view?.kind === "mfaExpired") {
      void navigate(ROUTES.login, { replace: true });
      return;
    }
    reset({ code: "" });
    setError(view);
    setAttempt((value) => value + 1);
  });

  // The MFA token lives in memory only; after a reload the user starts again.
  if (!pending) return <Navigate to={ROUTES.login} replace />;

  return (
    <>
      <AuthHeading title={t("mfa.title")} description={t("mfa.description")} />
      <div className="space-y-5">
        {error ? <AuthErrorMessage error={error} attempt={attempt} /> : null}
        <form
          noValidate
          onSubmit={(event) => void submit(event)}
          className="space-y-6"
          aria-label={t("mfa.title")}
        >
          <FormField
            label={t("fields.code")}
            hint={t("mfa.hint")}
            required
            error={errors.code?.message ? t(errors.code.message) : undefined}
          >
            <Controller
              control={control}
              name="code"
              render={({ field }) => (
                <OtpInput
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onBlur={field.onBlur}
                  disabled={isSubmitting}
                  // eslint-disable-next-line jsx-a11y-x/no-autofocus -- the code is this page's only task
                  autoFocus
                  onChange={(value) => {
                    field.onChange(value);
                    if (value.length === 6) void submit();
                  }}
                />
              )}
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            {t("mfa.submit")}
          </Button>
        </form>
        <Link
          to={ROUTES.login}
          className="mx-auto flex w-fit items-center gap-1.5 rounded text-sm font-medium text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("actions.backToSignIn")}
        </Link>
      </div>
    </>
  );
}

export default MfaPage;
