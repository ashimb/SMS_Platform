"use client";

import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-24 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-fg-muted">
          We could not load this page. Please try again in a moment.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-fg-subtle">Reference: {error.digest}</p>
        ) : null}
        <Button size="lg" className="mt-8" onClick={reset}>
          Try again
        </Button>
      </div>
    </Container>
  );
}
