import { Spinner } from "@school-platform/ui";

/** Shown while the session is restored or a route chunk loads; the label is announced. */
export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center text-primary">
      <Spinner size="lg" label={label} />
    </div>
  );
}
