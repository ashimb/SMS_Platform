import type { z } from "zod";

import type { academicsListParamsSchema } from "./schemas.ts";

/** TODO(academics phase): add entity types from the generated API schema (@school-platform/api-client). */
export type AcademicsListParams = z.infer<typeof academicsListParamsSchema>;
