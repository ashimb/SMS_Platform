import { useTranslation } from "react-i18next";

import { TraceId } from "@/shared/components/TraceId.tsx";

import type { AuthErrorView } from "../types.ts";
import { FormAlert } from "./FormAlert.tsx";

/** Sign-in error banner with deliberately generic wording (no account enumeration). */
export function AuthErrorMessage({ error, attempt }: { error: AuthErrorView; attempt: number }) {
  const { t } = useTranslation("auth");
  return (
    <FormAlert tone="error" focusKey={attempt}>
      <p>{t(`errors.${error.kind}`)}</p>
      {error.traceId ? <TraceId value={error.traceId} /> : null}
    </FormAlert>
  );
}
