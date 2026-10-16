/**
 * Sign-in form schemas. Messages are i18n keys (namespace "auth"), translated where rendered.
 * Client rules mirror the API (apps/api/app/common/validators.py, FRD FR-SEC-001) so users get
 * instant feedback; the API re-validates everything.
 */
import { z } from "zod";

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

const email = z
  .string()
  .trim()
  .min(1, "validation.emailRequired")
  .max(254, "validation.emailInvalid")
  .pipe(z.email("validation.emailInvalid"));

export const loginSchema = z.object({
  email,
  // No length rules at sign-in: say nothing about what a valid password looks like.
  password: z
    .string()
    .min(1, "validation.passwordRequired")
    .max(PASSWORD_MAX, "validation.passwordRequired"),
});

export const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "validation.codeInvalid"),
});

export const forgotPasswordSchema = z.object({ identifier: email });

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN, "validation.passwordTooShort")
      .max(PASSWORD_MAX, "validation.passwordTooLong"),
    confirm: z.string().min(1, "validation.confirmRequired"),
    mfaCode: z
      .string()
      .regex(/^(\d{6})?$/, "validation.codeInvalid")
      .optional(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "validation.passwordMismatch",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type MfaValues = z.infer<typeof mfaSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
