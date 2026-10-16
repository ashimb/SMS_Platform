import type { z } from "zod";

import type { communicationListParamsSchema } from "./schemas.ts";

/** TODO(communication phase): add entity types from the generated API schema (@school-platform/api-client). */
export type CommunicationListParams = z.infer<typeof communicationListParamsSchema>;
