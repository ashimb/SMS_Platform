"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui.tsx";

/**
 * Phone-only call to action pinned to the bottom of the screen (RESPONSIVE standard: "sticky
 * Apply/Enquire CTA on mobile"). It honours the home-indicator safe area, is hidden on the
 * admissions page (the form is right there) and a spacer keeps it from covering the footer.
 */
export function StickyMobileCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/admissions")) return null;

  return (
    <>
      <div aria-hidden="true" className="h-[calc(4.5rem+var(--sp-safe-bottom))] sm:hidden" />
      <div
        data-testid="mobile-cta"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-4 pt-3 pr-[max(1rem,var(--sp-safe-right))] pb-[max(0.75rem,var(--sp-safe-bottom))] pl-[max(1rem,var(--sp-safe-left))] shadow-3 backdrop-blur sm:hidden"
      >
        <Button asChild size="lg" className="w-full">
          <a href="/admissions#enquiry">Enquire / Apply now</a>
        </Button>
      </div>
    </>
  );
}
