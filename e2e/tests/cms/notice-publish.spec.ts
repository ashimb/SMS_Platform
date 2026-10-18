import { test } from "../../fixtures/index.ts";

// Blocked on the API's cms and communication modules (no endpoints yet). The website side is
// ready: it reads GET /api/public/v1/notices and is purged by the signed /api/revalidate webhook.
test.fixme("publish notice -> appears on the website", async () => {
  // 1. An administrator signs in to the portal and opens CMS -> Notices -> New notice.
  // 2. They write a title and body (rich text), pick the category "Holiday" and save a draft.
  // 3. Expect: the draft is NOT visible at /notices on the public website.
  // 4. They publish the notice. The API signs and sends the revalidation webhook
  //    (X-SP-Timestamp + X-SP-Signature) to the website.
  // 5. Expect: within a few seconds the notice is listed on the website home page notice board
  //    and at /notices/<slug>, with script tags in the body stripped.
  // 6. They unpublish it. Expect: /notices/<slug> returns 404 after revalidation.
});
