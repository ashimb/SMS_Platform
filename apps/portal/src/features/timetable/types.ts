import type { z } from "zod";

import type { timetableListParamsSchema } from "./schemas.ts";

/** TODO(timetable phase): add entity types from the generated API schema (@school-platform/api-client). */
export type TimetableListParams = z.infer<typeof timetableListParamsSchema>;
