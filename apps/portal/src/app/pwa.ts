/**
 * Service-worker registration (production only; imported dynamically from main.tsx).
 * Updates wait for the user: a toast offers "Reload" instead of swapping code under an open form.
 * See config/pwa.ts for the caching policy (API responses are never cached).
 */
import { toast } from "@school-platform/ui";
import { registerSW } from "virtual:pwa-register";

import { i18next } from "@/lib/i18n.ts";

export function registerServiceWorker(): void {
  const update = registerSW({
    onNeedRefresh() {
      toast(i18next.t("common:pwa.updateTitle"), {
        description: i18next.t("common:pwa.updateBody"),
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: i18next.t("common:pwa.reload"),
          onClick: () => {
            void update(true);
          },
        },
      });
    },
  });
}
