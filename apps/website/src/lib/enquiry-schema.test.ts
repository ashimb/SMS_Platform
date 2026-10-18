import { describe, expect, it } from "vitest";

import { ENQUIRY_DEFAULTS, enquirySchema } from "@/lib/enquiry-schema.ts";

const valid = {
  ...ENQUIRY_DEFAULTS,
  guardianName: "Priya Nair",
  childName: "Ananya Nair",
  email: "Priya@Example.com ",
  phone: "+91 98765 43210",
  grade: "Class VI",
  message: "  Interested in a campus visit.  ",
  consent: true,
};

function errorsFor(overrides: Record<string, unknown>) {
  const result = enquirySchema.safeParse({ ...valid, ...overrides });
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
}

describe("enquirySchema", () => {
  it("accepts a valid enquiry and normalises email and message", () => {
    const parsed = enquirySchema.parse(valid);
    expect(parsed.email).toBe("priya@example.com");
    expect(parsed.message).toBe("Interested in a campus visit.");
  });

  it("allows an empty message", () => {
    expect(enquirySchema.safeParse({ ...valid, message: "" }).success).toBe(true);
  });

  it.each([
    ["guardianName", "A"],
    ["guardianName", "Robert'); DROP TABLE"],
    ["guardianName", "R2D2"],
    ["childName", ""],
    ["email", "not-an-email"],
    ["phone", "abc"],
    ["phone", "12"],
    ["grade", "Class XIII"],
    ["grade", ""],
    ["message", "x".repeat(1001)],
    ["consent", false],
  ])("rejects invalid %s (%j)", (field, value) => {
    expect(errorsFor({ [field]: value })).toHaveProperty(field);
  });

  it("requires consent with a helpful message", () => {
    expect(errorsFor({ consent: false })["consent"]).toBe("Please agree so we can contact you.");
  });

  it("accepts unicode names", () => {
    expect(enquirySchema.safeParse({ ...valid, guardianName: "Ananya रॉय" }).success).toBe(true);
  });

  it("strips unknown keys", () => {
    const parsed = enquirySchema.parse({ ...valid, isAdmin: true });
    expect(parsed).not.toHaveProperty("isAdmin");
  });
});
