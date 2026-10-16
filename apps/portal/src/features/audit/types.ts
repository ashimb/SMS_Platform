import type { z } from "zod";

import type { auditListParamsSchema } from "./schemas.ts";

/** TODO(audit phase): add entity types from the generated API schema (@school-platform/api-client). */
export type AuditListParams = z.infer<typeof auditListParamsSchema>;
