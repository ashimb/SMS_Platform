import type { z } from "zod";

import type { cmsListParamsSchema } from "./schemas.ts";

/** TODO(cms phase): add entity types from the generated API schema (@school-platform/api-client). */
export type CmsListParams = z.infer<typeof cmsListParamsSchema>;
