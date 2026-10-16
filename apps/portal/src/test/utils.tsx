/** Test helpers: render the real route tree in a memory router with fresh providers. */
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { Providers } from "@/app/providers.tsx";
import { routes } from "@/app/router.tsx";
import { auth } from "@/lib/auth-store.ts";

import { mockSignedIn } from "./mocks/handlers.ts";

export function testQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

/** Render the full app at `path` (guards, layouts, lazy pages, i18n, MSW-backed API). */
export function renderApp(path: string) {
  // As in main.tsx: silent sign-in starts before the first render (no-op if already settled).
  void auth.init();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const view = render(
    <Providers queryClient={testQueryClient()}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, router, user };
}

export function renderWithProviders(ui: ReactElement) {
  const user = userEvent.setup();
  return { ...render(<Providers queryClient={testQueryClient()}>{ui}</Providers>), user };
}

/** Sign in through the real silent-refresh path, as if the refresh cookie were present. */
export async function signInAs(email: string): Promise<void> {
  mockSignedIn(email);
  await auth.init();
  if (auth.store.getState().status !== "authenticated") {
    throw new Error(`mock sign-in failed for ${email}`);
  }
}
