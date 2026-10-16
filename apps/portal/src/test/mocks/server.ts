/** MSW for Vitest (Node). Unhandled requests fail the test, so no call can silently escape. */
import { setupServer } from "msw/node";

import { handlers } from "./handlers.ts";

export const server = setupServer(...handlers);
