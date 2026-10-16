import { useEffect } from "react";

import { useBranding } from "@/app/branding.tsx";

/** "Students · Sunrise Vidyalaya": every page gets a unique, descriptive title (WCAG 2.4.2). */
export function useDocumentTitle(title: string | null | undefined): void {
  const { name } = useBranding();
  useEffect(() => {
    document.title = title ? `${title} · ${name}` : name;
  }, [title, name]);
}
