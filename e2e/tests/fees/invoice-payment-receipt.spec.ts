import { test } from "../../fixtures/index.ts";

// Blocked on the fees module and a payment-gateway sandbox.
test.fixme("invoice -> online payment -> receipt", async () => {
  // 1. An accountant signs in and generates the term invoice for a student.
  // 2. The parent signs in, opens Fees and sees the invoice with the exact DECIMAL amount.
  // 3. The parent chooses "Pay now" and completes payment in the gateway sandbox.
  // 4. The gateway calls the signed payment webhook; replaying the same webhook is ignored.
  // 5. Expect: the invoice shows "Paid" and a receipt PDF can be downloaded.
  // 6. Expect: the receipt number is sequential and appears in the accountant's ledger.
  // 7. Expect: an underpayment or a failed payment leaves the invoice open.
});
