import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Input } from "@school-platform/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { auth, useAuth } from "@/lib/auth-store.ts";
import { ROUTES, safeNextPath } from "@/shared/constants/routes.ts";

import { describeAuthError } from "../api/index.ts";
import { AuthErrorMessage } from "../components/AuthErrorMessage.tsx";
import { AuthHeading } from "../components/AuthHeading.tsx";
import { FormAlert } from "../components/FormAlert.tsx";
import { PasswordInput } from "../components/PasswordInput.tsx";
import { loginSchema, type LoginValues } from "../schemas.ts";
import type { AuthErrorView } from "../types.ts";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const endReason = useAuth((state) => state.endReason);
  const [error, setError] = useState<AuthErrorView | null>(null);
  const [attempt, setAttempt] = useState(0);

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    const result = await auth.login(email, password);
    if (result.kind === "ok") {
      void navigate(next, { replace: true });
      return;
    }
    if (result.kind === "mfa") {
      const query = next === ROUTES.home ? "" : `?next=${encodeURIComponent(next)}`;
      void navigate(`${ROUTES.mfa}${query}`);
      return;
    }
    resetField("password");
    setError(describeAuthError(result.error));
    setAttempt((value) => value + 1);
  });

  return (
    <>
      <AuthHeading title={t("login.title")} description={t("login.description")} />
      <div className="space-y-5">
        {error ? <AuthErrorMessage error={error} attempt={attempt} /> : null}
        {!error && endReason ? (
          <FormAlert tone="info">
            <p>{t(`session.${endReason}`)}</p>
          </FormAlert>
        ) : null}
        <form
          noValidate
          onSubmit={(event) => void onSubmit(event)}
          className="space-y-5"
          aria-label={t("login.title")}
        >
          <FormField
            label={t("fields.email")}
            required
            error={errors.email?.message ? t(errors.email.message) : undefined}
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={isSubmitting}
              {...register("email")}
            />
          </FormField>
          <FormField
            label={t("fields.password")}
            required
            error={errors.password?.message ? t(errors.password.message) : undefined}
          >
            <PasswordInput
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register("password")}
            />
          </FormField>
          <div className="-mt-2 flex justify-end">
            <Link
              to={ROUTES.forgotPassword}
              className="rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {t("login.forgot")}
            </Link>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            {t("login.submit")}
          </Button>
        </form>
        <p className="text-center text-xs text-fg-subtle">{t("login.help")}</p>
      </div>
    </>
  );
}

export default LoginPage;
