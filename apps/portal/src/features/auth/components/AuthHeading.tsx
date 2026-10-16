import type { ReactNode } from "react";

import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle.ts";

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  useDocumentTitle(title);
  return (
    <div className="mb-8 space-y-2">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">{title}</h1>
      {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
    </div>
  );
}
