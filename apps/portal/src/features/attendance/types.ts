import type { z } from "zod";

import type { attendanceListParamsSchema } from "./schemas.ts";

/** TODO(attendance phase): add entity types from the generated API schema (@school-platform/api-client). */
export type AttendanceListParams = z.infer<typeof attendanceListParamsSchema>;
