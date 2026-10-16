import type { z } from "zod";

import type { guardiansListParamsSchema } from "./schemas.ts";

/** TODO(guardians phase): add entity types from the generated API schema (@school-platform/api-client). */
export type GuardiansListParams = z.infer<typeof guardiansListParamsSchema>;
