/**
 * Student form and URL schemas. Rules mirror the API (apps/api/app/modules/students/schemas.py
 * and app/common/validators.py) for instant feedback; the API validates again and its 422
 * details are mapped back onto the same fields. Messages are i18n keys in the "students" namespace.
 */
import { z } from "zod";

import { ageOn, todayIsoDate } from "@/shared/utils/format.ts";

import { GENDERS, STUDENT_STATUSES, type StudentListParams } from "./types.ts";

export const MIN_AGE_YEARS = 2;
export const MAX_AGE_YEARS = 25;
export const SEARCH_MIN_LENGTH = 2;

/** Letters (any script, incl. Indic combining marks), spaces and . ' - (as the API allows). */
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

const collapse = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ");

const requiredName = z
  .string()
  .transform(collapse)
  .pipe(
    z
      .string()
      .min(1, "validation.nameRequired")
      .max(100, "validation.nameTooLong")
      .regex(NAME_PATTERN, "validation.nameInvalid"),
  );

/** Optional text field: "" from the form becomes null for the API. */
function optional<T extends z.ZodType<string, string>>(schema: T) {
  return z
    .string()
    .transform(collapse)
    .pipe(z.union([z.literal("").transform(() => null), schema]));
}

const optionalName = optional(
  z.string().max(100, "validation.nameTooLong").regex(NAME_PATTERN, "validation.nameInvalid"),
);

const pastDate = z
  .string()
  .min(1, "validation.dateRequired")
  .pipe(z.iso.date("validation.dateInvalid"))
  .refine((value) => value <= todayIsoDate(), "validation.dateInFuture");

export const studentCreateSchema = z
  .object({
    admission_no: z
      .string()
      .trim()
      .min(1, "validation.admissionNoRequired")
      .regex(/^[A-Za-z0-9/-]{1,20}$/, "validation.admissionNoInvalid"),
    first_name: requiredName,
    middle_name: optionalName,
    last_name: optionalName,
    date_of_birth: pastDate,
    // Input is a plain string ("" = nothing chosen yet), output the API enum.
    gender: z.string().pipe(z.enum(GENDERS, "validation.genderRequired")),
    admission_date: pastDate,
    current_grade: optional(z.string().max(20, "validation.gradeTooLong")),
    section: optional(z.string().max(10, "validation.sectionTooLong")),
  })
  .superRefine((value, ctx) => {
    const age = ageOn(value.date_of_birth, value.admission_date);
    if (age !== null && (age < MIN_AGE_YEARS || age > MAX_AGE_YEARS)) {
      ctx.addIssue({ code: "custom", path: ["date_of_birth"], message: "validation.ageRange" });
    }
  });

export const studentUpdateSchema = z.object({
  first_name: requiredName,
  middle_name: optionalName,
  last_name: optionalName,
  current_grade: optional(z.string().max(20, "validation.gradeTooLong")),
  section: optional(z.string().max(10, "validation.sectionTooLong")),
});

/**
 * Edit form: same inputs as create (so one form component serves both), but only the fields the
 * API lets you change are validated; the others are displayed read-only and not sent.
 */
export const studentEditFormSchema = studentUpdateSchema.extend({
  admission_no: z.string(),
  date_of_birth: z.string(),
  gender: z.string(),
  admission_date: z.string(),
});

/** Raw form values (what the inputs hold) vs. parsed output (what the API receives). */
export type StudentCreateInput = z.input<typeof studentCreateSchema>;
export type StudentCreateOutput = z.output<typeof studentCreateSchema>;
export type StudentUpdateOutput = z.output<typeof studentUpdateSchema>;
export type StudentEditFormOutput = z.output<typeof studentEditFormSchema>;

const statusParam = z.enum(STUDENT_STATUSES).nullable().catch(null);

/** Read list state from the URL; anything malformed falls back to defaults instead of erroring. */
export function parseListParams(search: URLSearchParams): StudentListParams {
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(10_000)
    .catch(1)
    .parse(search.get("page") ?? 1);
  const q = (search.get("q") ?? "").slice(0, 100);
  return { page, q, status: statusParam.parse(search.get("status")) };
}

export function toSearchParams(params: StudentListParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page > 1) search.set("page", String(params.page));
  return search;
}
