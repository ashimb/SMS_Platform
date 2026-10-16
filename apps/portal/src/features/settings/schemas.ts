/**
 * Settings form and URL schemas. TODO(settings phase): mirror the API request schemas (module CFG / TEN)
 * here, as features/students/schemas.ts does.
 */
import { z } from "zod";

/** List pages use the API's pagination contract (page >= 1); bad input falls back to page 1. */
export const settingsListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});
