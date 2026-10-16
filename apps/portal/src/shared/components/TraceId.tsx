import { Button } from "@school-platform/ui";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Support reference for an error: the API's trace_id (matches the server logs) or a client-side
 * reference for errors that never reached the API. Contains no personal data.
 */
export function TraceId({ value }: { value: string }) {
  const { t } = useTranslation("common", { useSuspense: false });
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-sunken py-1 pr-1 pl-3 text-xs text-fg-muted">
      <span>
        {t("errors.reference", { defaultValue: "Reference" })}:{" "}
        <code className="font-mono text-fg">{value}</code>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={copy}
        aria-label={t("errors.copyReference", { defaultValue: "Copy reference" })}
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Button>
      <span role="status" className="sr-only">
        {copied ? t("errors.copied", { defaultValue: "Copied" }) : ""}
      </span>
    </div>
  );
}
