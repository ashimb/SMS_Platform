import type { z } from "zod";

import type { examsListParamsSchema } from "./schemas.ts";

/** TODO(exams phase): add entity types from the generated API schema (@school-platform/api-client). */
export type ExamsListParams = z.infer<typeof examsListParamsSchema>;
