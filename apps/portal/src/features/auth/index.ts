/** Auth feature: sign-in, MFA step, forgotten/reset password. Pages are lazy-loaded by the router. */
export { describeAuthError, requestPasswordReset, resetPassword } from "./api/index.ts";
export { OtpInput } from "./components/OtpInput.tsx";
export { PasswordInput } from "./components/PasswordInput.tsx";
export {
  forgotPasswordSchema,
  loginSchema,
  mfaSchema,
  PASSWORD_MAX,
  PASSWORD_MIN,
  resetPasswordSchema,
} from "./schemas.ts";
export type { AuthErrorView, AuthFailure } from "./types.ts";
