import type { Schemas } from "@/lib/api.ts";

/** API shapes come from the generated OpenAPI schema, so they cannot drift from the backend. */
export type Student = Schemas["StudentOut"];
export type StudentCreateBody = Schemas["StudentCreate"];
export type StudentUpdateBody = Schemas["StudentUpdate"];
export type StudentPage = Schemas["Page_StudentOut_"];

export const STUDENT_STATUSES = [
  "provisional",
  "enrolled",
  "withdrawn",
  "transferred",
  "alumni",
] as const;
export const GENDERS = ["female", "male", "other", "undisclosed"] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export type Gender = (typeof GENDERS)[number];

/** List state, kept in the URL so filters survive reloads and can be shared. */
export interface StudentListParams {
  page: number;
  q: string;
  status: StudentStatus | null;
}
