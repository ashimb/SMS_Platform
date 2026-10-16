import type { z } from "zod";

import type { reportsListParamsSchema } from "./schemas.ts";

/** TODO(reports phase): add entity types from the generated API schema (@school-platform/api-client). */
export type ReportsListParams = z.infer<typeof reportsListParamsSchema>;
