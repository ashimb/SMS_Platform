import type { z } from "zod";

import type { settingsListParamsSchema } from "./schemas.ts";

/** TODO(settings phase): add entity types from the generated API schema (@school-platform/api-client). */
export type SettingsListParams = z.infer<typeof settingsListParamsSchema>;
