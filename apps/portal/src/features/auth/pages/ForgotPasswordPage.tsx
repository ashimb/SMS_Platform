import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormField, Input } from "@school-platform/ui";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { isApiError } from "@/lib/api.ts";
import { ROUTES } from "@/shared/constants/routes.ts";

import { requestPasswordReset } from "../api/index.ts";
import { AuthHeading } from "../components/AuthHeading.tsx";
import { FormAlert } from "../components/FormAlert.tsx";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas.ts";

/**
 * Request a reset link (FRD FR-AUTH-005). The confirmation is identical whether or not the email
 * belongs to an account, so the page cannot be used to discover who has one.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<"rateLimited" | "offline" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = handleSubmit(async ({ identifier }) => {
    setFailure(null);
    try {
      await requestPasswordReset(identifier);
      setSent(true);
    } catch (error) {
      if (isApiError(error, 429)) setFailure("rateLimited");
      else if (isApiError(error, 0)) setFailure("offline");
      // Any other answer still shows the same neutral confirmation.
      else setSent(true);
    }
  });

  const back = (
    <Link
      to={ROUTES.login}
      className="mx-auto flex w-fit items-center gap-1.5 rounded text-sm font-medium text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {t("actions.backToSignIn")}
    </Link>
  );

  if (sent) {
    return (
      <>
        <span className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-success-subtle text-success-subtle-fg">
          <MailCheck aria-hidden="true" className="size-6" />
        </span>
        <AuthHeading title={t("forgot.sentTitle")} />
        <div className="space-y-6">
          <FormAlert tone="success">
            <p>{t("forgot.sentBody")}</p>
          </FormAlert>
          {back}
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading title={t("forgot.title")} description={t("forgot.description")} />
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
          aria-label={t("forgot.title")}
        >
          <FormField
            label={t("fields.email")}
            required
            error={errors.identifier?.message ? t(errors.identifier.message) : undefined}
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={isSubmitting}
              {...register("identifier")}
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            {t("forgot.submit")}
          </Button>
        </form>
        {back}
      </div>
    </>
  );
}

export default ForgotPasswordPage;
