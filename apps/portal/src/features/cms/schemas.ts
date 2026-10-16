/**
 * Cms form and URL schemas. TODO(cms phase): mirror the API request schemas (module CMS)
 * here, as features/students/schemas.ts does.
 */
import { z } from "zod";

/** List pages use the API's pagination contract (page >= 1); bad input falls back to page 1. */
export const cmsListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});
