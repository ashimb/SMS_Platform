import type { z } from "zod";

import type { feesListParamsSchema } from "./schemas.ts";

/** TODO(fees phase): add entity types from the generated API schema (@school-platform/api-client). */
export type FeesListParams = z.infer<typeof feesListParamsSchema>;
