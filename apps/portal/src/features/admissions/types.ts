import type { z } from "zod";

import type { admissionsListParamsSchema } from "./schemas.ts";

/** TODO(admissions phase): add entity types from the generated API schema (@school-platform/api-client). */
export type AdmissionsListParams = z.infer<typeof admissionsListParamsSchema>;
