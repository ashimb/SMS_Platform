/**
 * Error boundary with a support reference.
 *
 * API failures carry the server's trace_id (searchable in the API logs). Errors raised in the
 * browser get a short client reference that is also written to the console, so support can match
 * a user's screenshot with a bug report. No message text that may contain personal data is shown
 * for unexpected errors.
 */
import { Button } from "@school-platform/ui";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { isApiError } from "@/lib/api.ts";

import { TraceId } from "./TraceId.tsx";

export function errorReference(error: unknown): string {
  if (isApiError(error) && error.traceId) return error.traceId;
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2);
  return `c-${random.replaceAll("-", "").slice(0, 12)}`;
}

export interface ErrorFallbackProps {
  error: unknown;
  reference: string;
  onRetry?: () => void;
  /** Full page (route-level) or inline (a widget). */
  variant?: "page" | "inline";
}

export function ErrorFallback({ reference, onRetry, variant = "page" }: ErrorFallbackProps) {
  const { t } = useTranslation("common", { useSuspense: false });
  return (
    <div
      role="alert"
      className={
        variant === "page"
          ? "mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center"
          : "flex flex-col items-center gap-3 rounded-xl border border-danger-200 bg-danger-subtle/40 p-6 text-center"
      }
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger-subtle text-danger-subtle-fg">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-display text-xl font-semibold text-fg">
          {t("errors.unexpectedTitle", { defaultValue: "Something went wrong" })}
        </h2>
        <p className="text-sm text-fg-muted">
          {t("errors.unexpectedBody", {
            defaultValue:
              "Your data is safe. Try again, and if it keeps happening, share the reference below with the school office.",
          })}
        </p>
      </div>
      <TraceId value={reference} />
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            {t("actions.tryAgain", { defaultValue: "Try again" })}
          </Button>
        ) : null}
        {variant === "page" ? (
          <Button asChild variant="secondary">
            <a href="/">{t("actions.goHome", { defaultValue: "Go to dashboard" })}</a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: "page" | "inline";
  /** Reset the boundary when any of these change (e.g. the route path). */
  resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
  error: unknown;
  reference: string | null;
  resetKeys: readonly unknown[] | undefined;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null, reference: null, resetKeys: undefined };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error, reference: errorReference(error) };
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    const changed =
      props.resetKeys !== undefined &&
      state.resetKeys !== undefined &&
      (props.resetKeys.length !== state.resetKeys.length ||
        props.resetKeys.some((key, i) => !Object.is(key, state.resetKeys?.[i])));
    if (changed) return { error: null, reference: null, resetKeys: props.resetKeys };
    return state.resetKeys === props.resetKeys ? null : { resetKeys: props.resetKeys };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Reference + component stack only; never the error message (it can contain user input).
    console.error(`[portal] error ref=${this.state.reference ?? "?"}`, info.componentStack, error);
  }

  private readonly retry = () => {
    this.setState({ error: null, reference: null });
  };

  override render() {
    if (this.state.reference === null) return this.props.children;
    return (
      <ErrorFallback
        error={this.state.error}
        reference={this.state.reference}
        onRetry={this.retry}
        variant={this.props.variant ?? "page"}
      />
    );
  }
}
