/**
 * Admissions enquiry payload, shared by the browser form (React Hook Form) and the server proxy,
 * so both enforce the same rules. The server is authoritative; the form only gives early feedback.
 */
import { z } from "zod";

export const GRADES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class I",
  "Class II",
  "Class III",
  "Class IV",
  "Class V",
  "Class VI",
  "Class VII",
  "Class VIII",
  "Class IX",
  "Class X",
  "Class XI",
  "Class XII",
] as const;
export type Grade = (typeof GRADES)[number];

const personName = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters.")
  .max(100, "Use 100 characters or fewer.")
  .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, "Use letters, spaces, dots, apostrophes or hyphens.");

export const enquirySchema = z.object({
  guardianName: personName,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email is too long.")
    .pipe(z.email("Enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ()-]{6,18}[0-9]$/, "Enter a valid phone number."),
  childName: personName,
  grade: z.enum(GRADES, "Choose the class you are enquiring about."),
  message: z.string().trim().max(1000, "Use 1000 characters or fewer."),
  consent: z.boolean().refine((value) => value, "Please agree so we can contact you."),
  /** Honeypot: hidden from people, so any value means an automated submission. */
  website: z.string().max(200),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** Form defaults. `grade` is left unset so the visitor must choose a class deliberately. */
export const ENQUIRY_DEFAULTS: Omit<EnquiryInput, "grade"> = {
  guardianName: "",
  email: "",
  phone: "",
  childName: "",
  message: "",
  consent: false,
  website: "",
};

/** Response of the proxy route. */
export interface EnquiryResponse {
  reference: string;
}
