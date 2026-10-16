import type { z } from "zod";

import type { staffListParamsSchema } from "./schemas.ts";

/** TODO(staff phase): add entity types from the generated API schema (@school-platform/api-client). */
export type StaffListParams = z.infer<typeof staffListParamsSchema>;
