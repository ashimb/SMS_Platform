import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Input } from "@school-platform/ui";
import { ArrowLeft, CircleCheck, KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { isApiError } from "@/lib/api.ts";
import { clearResetToken, getResetToken } from "@/lib/reset-token.ts";
import { ROUTES } from "@/shared/constants/routes.ts";

import { resetPassword } from "../api/index.ts";
import { AuthHeading } from "../components/AuthHeading.tsx";
import { FormAlert } from "../components/FormAlert.tsx";
import { PasswordInput } from "../components/PasswordInput.tsx";
import { PASSWORD_MIN, resetPasswordSchema, type ResetPasswordValues } from "../schemas.ts";

type Outcome = "done" | "invalidLink" | null;

/**
 * Set a new password from an emailed link (FRD FR-AUTH-005). The token was moved out of the URL
 * into memory before the app started (lib/reset-token.ts), and this page also sets
 * `Referrer-Policy: no-referrer` as a second layer.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const [token] = useState(getResetToken);
  const [outcome, setOutcome] = useState<Outcome>(token ? null : "invalidLink");
  const [failure, setFailure] = useState<"rateLimited" | "offline" | "unknown" | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "", mfaCode: "" },
  });

  const onSubmit = handleSubmit(async ({ password, mfaCode }) => {
    if (!token) return;
    setFailure(null);
    try {
      await resetPassword({ token, password, mfaCode });
      clearResetToken();
      setOutcome("done");
    } catch (error) {
      if (isApiError(error, 410)) {
        clearResetToken();
        setOutcome("invalidLink");
      } else if (isApiError(error, 422)) {
        const fields = error.fieldErrors();
        const message = fields["new_password"] ?? fields["mfa_code"] ?? error.message;
        setError(fields["mfa_code"] ? "mfaCode" : "password", { message });
      } else if (isApiError(error, 429)) setFailure("rateLimited");
      else if (isApiError(error, 0)) setFailure("offline");
      else setFailure("unknown");
    }
  });

  const referrer = <meta name="referrer" content="no-referrer" />;

  if (outcome === "done") {
    return (
      <>
        {referrer}
        <span className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-success-subtle text-success-subtle-fg">
          <CircleCheck aria-hidden="true" className="size-6" />
        </span>
        <AuthHeading title={t("reset.doneTitle")} description={t("reset.doneBody")} />
        <Button asChild size="lg" className="w-full">
          <Link to={ROUTES.login}>{t("actions.signIn")}</Link>
        </Button>
      </>
    );
  }

  if (outcome === "invalidLink") {
    return (
      <>
        {referrer}
        <span className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-warning-subtle text-warning-subtle-fg">
          <KeyRound aria-hidden="true" className="size-6" />
        </span>
        <AuthHeading title={t("reset.invalidTitle")} description={t("reset.invalidBody")} />
        <div className="space-y-4">
          <Button asChild size="lg" className="w-full">
            <Link to={ROUTES.forgotPassword}>{t("reset.requestNew")}</Link>
          </Button>
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

  return (
    <>
      {referrer}
      <AuthHeading
        title={t("reset.title")}
        description={t("reset.description", { min: PASSWORD_MIN })}
      />
      <div className="space-y-5">
        {failure ? (
          <FormAlert tone="error">
            <p>{t(`errors.${failure}`)}</p>
          </FormAlert>
        ) : null}
        <form
          noValidate
          onSubmit={(event) => void onSubmit(event)}
          className="space-y-5"
          aria-label={t("reset.title")}
        >
          <FormField
            label={t("fields.newPassword")}
            hint={t("reset.passwordHint", { min: PASSWORD_MIN })}
            required
            error={
              errors.password?.message
                ? t(errors.password.message, { min: PASSWORD_MIN })
                : undefined
            }
          >
            <PasswordInput
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register("password")}
            />
          </FormField>
          <FormField
            label={t("fields.confirmPassword")}
            required
            error={errors.confirm?.message ? t(errors.confirm.message) : undefined}
          >
            <PasswordInput
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register("confirm")}
            />
          </FormField>
          <FormField
            label={t("fields.mfaCodeOptional")}
            hint={t("reset.mfaHint")}
            error={errors.mfaCode?.message ? t(errors.mfaCode.message) : undefined}
          >
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={isSubmitting}
              {...register("mfaCode")}
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            {t("reset.submit")}
          </Button>
        </form>
      </div>
    </>
  );
}

export default ResetPasswordPage;
