import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";

export default function NotFound() {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-24 text-center">
      <div className="max-w-md">
        <p className="font-display text-6xl font-semibold text-primary-subtle-fg">404</p>
        <h1 className="mt-4 text-3xl font-semibold">We couldn't find that page</h1>
        <p className="mt-3 text-fg-muted">
          The page may have moved or no longer exists. Try the home page or one of the links in the
          menu.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </Container>
  );
}
