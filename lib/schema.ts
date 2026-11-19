import { z } from "zod";

export const SKILL_LEVELS = ["Complete Beginner", "Know Basics", "Intermediate"] as const;
export const CLASS_MODES = ["In-person (Physical)", "Online"] as const;
export const PREFERRED_DAYS = ["Weekdays", "Weekends"] as const;
export const STARTER_KIT = ["Yes (With full materials)", "No (I will bring my own)"] as const;
export const STUDENT_STATUS = ["Active", "Completed", "Dropped"] as const;
export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Online"] as const;
export const ATTENDANCE_STATUS = ["Present", "Absent"] as const;

export const DECLARATION =
  "I confirm that the above details are correct and I agree to follow the class timings and guidelines.";

const PHONE_RE = /^\+?[0-9 -]{9,16}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(100),
    dob: z
      .string()
      .regex(DATE_RE, "Date of birth is required")
      .refine((d) => {
        const t = new Date(d).getTime();
        return !isNaN(t) && t < Date.now() && t > new Date("1900-01-01").getTime();
      }, "Enter a valid date of birth"),
    whatsapp: z.string().trim().regex(PHONE_RE, "Enter a valid contact / WhatsApp number"),
    address: z.string().trim().min(5, "Address is required").max(300),
    skillLevel: z.enum(SKILL_LEVELS, { message: "Select your skill level" }),
    classMode: z.enum(CLASS_MODES, { message: "Select a class mode" }),
    preferredDays: z.enum(PREFERRED_DAYS, { message: "Select your preferred days" }),
    starterKit: z.enum(STARTER_KIT, { message: "Tell us if you need a starter kit" }),
    emergencyName: z.string().trim().max(100).default(""),
    emergencyPhone: z
      .string()
      .trim()
      .default("")
      .refine((v) => v === "" || PHONE_RE.test(v), "Enter a valid phone number"),
    agreed: z.literal(true, { message: "Please agree to the terms & declaration" }),
  });

export type Registration = z.infer<typeof registrationSchema>;

export const attendanceSchema = z.object({
  date: z.string().regex(DATE_RE, "Pick a date"),
  batch: z.string().trim().min(1, "Pick a batch"),
  records: z
    .array(z.object({ studentId: z.string().min(1), status: z.enum(ATTENDANCE_STATUS) }))
    .min(1, "No students to mark"),
});

export const paymentSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  amount: z.coerce.number().positive("Amount must be more than 0"),
  date: z.string().regex(DATE_RE, "Pick a date"),
  method: z.enum(PAYMENT_METHODS),
  note: z.string().trim().max(200).default(""),
});

export const studentPatchSchema = z.object({
  courseFee: z.coerce.number().min(0).optional(),
  status: z.enum(STUDENT_STATUS).optional(),
});

export const settingsSchema = z.object({
  currentBatch: z.string().trim().min(1, "Batch is required").max(40),
  feeWithKit: z.coerce.number().min(0),
  feeWithoutKit: z.coerce.number().min(0),
});

/** Turn zod issues into { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}
