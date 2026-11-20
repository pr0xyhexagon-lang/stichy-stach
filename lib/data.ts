/**
 * Business logic on top of the sheet helpers. API routes and server pages call these.
 */
import { appendRows, getRows, updateRows, DEFAULT_SETTINGS, type Row } from "./sheets";
import { ageFromDob, nowStamp, todayISO, toNumber } from "./format";
import { STARTER_KIT_NOTE, type Registration } from "./schema";
import type { AttendanceSheet, Payment, StudentSummary } from "./types";
import type { z } from "zod";
import type { attendanceSchema, paymentSchema, settingsSchema, studentPatchSchema } from "./schema";

export class AppError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/* ----------------------------- Settings ----------------------------- */

export interface Settings {
  currentBatch: string;
  /** Full course fee (starter kit included free). */
  courseFee: number;
}

export async function getSettings(): Promise<Settings> {
  const rows = await getRows("Settings");
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.Key) map[r.Key] = r.Value;
  return {
    currentBatch: map.CurrentBatch,
    courseFee: toNumber(map.CourseFee),
  };
}

export async function saveSettings(s: z.infer<typeof settingsSchema>) {
  const rows = await getRows("Settings");
  const values: Record<string, string> = {
    CurrentBatch: s.currentBatch,
    CourseFee: String(s.courseFee),
  };
  const updates: Row[] = [];
  const appends: Row[] = [];
  for (const [Key, Value] of Object.entries(values)) {
    const existing = rows.find((r) => r.Key === Key);
    if (existing) updates.push({ ...existing, Value });
    else appends.push({ Key, Value });
  }
  await updateRows("Settings", updates);
  await appendRows("Settings", appends);
}

/* ---------------------------- Registration ---------------------------- */

export async function registerStudent(data: Registration): Promise<{ id: string; batch: string }> {
  const [settings, students] = await Promise.all([getSettings(), getRows("Students")]);
  const batch = settings.currentBatch;

  const phoneKey = (p: string) => p.replace(/\D/g, "").slice(-9);
  if (
    students.some(
      (s) => s.Batch === batch && phoneKey(s.WhatsApp) === phoneKey(data.whatsapp) &&
        s.FullName.toLowerCase() === data.fullName.toLowerCase()
    )
  ) {
    throw new AppError(`You are already registered for ${batch}.`, 409);
  }

  const batchNum = (batch.match(/\d+/)?.[0] ?? "0").padStart(2, "0");
  const prefix = `STS-${batchNum}-`;
  const seq =
    Math.max(0, ...students.filter((s) => s.StudentID.startsWith(prefix)).map((s) => toNumber(s.StudentID.slice(prefix.length)))) + 1;
  const id = prefix + String(seq).padStart(3, "0");
  const fee = settings.courseFee;

  await appendRows("Students", [
    {
      StudentID: id,
      RegisteredAt: nowStamp(),
      Batch: batch,
      FullName: data.fullName,
      DOB: data.dob,
      Age: ageFromDob(data.dob) ?? "",
      WhatsApp: data.whatsapp,
      Address: data.address,
      SkillLevel: data.skillLevel,
      ClassMode: data.classMode,
      PreferredDays: data.preferredDays,
      StarterKit: STARTER_KIT_NOTE,
      EmergencyName: data.emergencyName,
      EmergencyPhone: data.emergencyPhone,
      AgreedTerms: "Yes",
      // No separate signature field: agreeing to the declaration counts as signing with the student's name.
      SignatureName: data.fullName,
      SignatureDate: todayISO(),
      CourseFee: fee,
      Status: "Active",
    },
  ]);
  return { id, batch };
}

/* ------------------------------ Students ------------------------------ */

export async function listStudents(): Promise<StudentSummary[]> {
  const [students, payments, attendance] = await Promise.all([
    getRows("Students"),
    getRows("Payments"),
    getRows("Attendance"),
  ]);

  const paid = new Map<string, number>();
  for (const p of payments) paid.set(p.StudentID, (paid.get(p.StudentID) ?? 0) + toNumber(p.Amount));

  const present = new Map<string, number>();
  const sessions = new Map<string, number>();
  for (const a of attendance) {
    sessions.set(a.StudentID, (sessions.get(a.StudentID) ?? 0) + 1);
    if (a.Status === "Present") present.set(a.StudentID, (present.get(a.StudentID) ?? 0) + 1);
  }

  return students.map((s) => {
    const fee = toNumber(s.CourseFee);
    const p = paid.get(s.StudentID) ?? 0;
    return {
      id: s.StudentID,
      fullName: s.FullName,
      batch: s.Batch,
      status: s.Status || "Active",
      whatsapp: s.WhatsApp,
      classMode: s.ClassMode,
      starterKit: s.StarterKit,
      courseFee: fee,
      paid: p,
      due: Math.max(0, fee - p),
      present: present.get(s.StudentID) ?? 0,
      sessions: sessions.get(s.StudentID) ?? 0,
      details: s,
    };
  });
}

export async function updateStudent(id: string, patch: z.infer<typeof studentPatchSchema>) {
  const students = await getRows("Students");
  const s = students.find((r) => r.StudentID === id);
  if (!s) throw new AppError("Student not found", 404);
  await updateRows("Students", [
    {
      ...s,
      ...(patch.courseFee !== undefined && { CourseFee: patch.courseFee }),
      ...(patch.status && { Status: patch.status }),
    },
  ]);
}

/* ----------------------------- Attendance ----------------------------- */

export async function getAttendance(date: string, batch: string): Promise<AttendanceSheet> {
  const [students, attendance] = await Promise.all([listStudents(), getRows("Attendance")]);
  const marks = new Map(
    attendance.filter((a) => a.Date === date && a.Batch === batch).map((a) => [a.StudentID, a.Status])
  );
  const rows = students
    .filter((s) => s.batch === batch && (s.status === "Active" || marks.has(s.id)))
    .map((s) => {
      const m = marks.get(s.id);
      return {
        studentId: s.id,
        fullName: s.fullName,
        status: (m === "Present" || m === "Absent" ? m : null) as "Present" | "Absent" | null,
        present: s.present,
        sessions: s.sessions,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return { date, batch, saved: marks.size > 0, rows };
}

/** Insert or update one row per student for the given date (no duplicates on re-save). */
export async function saveAttendance(input: z.infer<typeof attendanceSchema>) {
  const [students, attendance] = await Promise.all([getRows("Students"), getRows("Attendance")]);
  const names = new Map(students.map((s) => [s.StudentID, s.FullName]));
  const existing = new Map(
    attendance.filter((a) => a.Date === input.date && a.Batch === input.batch).map((a) => [a.StudentID, a])
  );
  const stamp = nowStamp();
  const updates: Row[] = [];
  const appends: Row[] = [];
  for (const r of input.records) {
    if (!names.has(r.studentId)) throw new AppError(`Unknown student ${r.studentId}`);
    const row = {
      Date: input.date,
      Batch: input.batch,
      StudentID: r.studentId,
      FullName: names.get(r.studentId)!,
      Status: r.status,
      MarkedAt: stamp,
    };
    const prev = existing.get(r.studentId);
    if (prev) updates.push({ ...row, _row: prev._row });
    else appends.push(row);
  }
  await updateRows("Attendance", updates);
  await appendRows("Attendance", appends);
}

/* ------------------------------ Payments ------------------------------ */

export async function listPayments(studentId?: string): Promise<Payment[]> {
  const rows = await getRows("Payments");
  return rows
    .filter((p) => !studentId || p.StudentID === studentId)
    .map((p) => ({
      id: p.PaymentID,
      date: p.Date,
      studentId: p.StudentID,
      fullName: p.FullName,
      amount: toNumber(p.Amount),
      method: p.Method,
      note: p.Note,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function addPayment(input: z.infer<typeof paymentSchema>) {
  const [students, payments] = await Promise.all([getRows("Students"), getRows("Payments")]);
  const s = students.find((r) => r.StudentID === input.studentId);
  if (!s) throw new AppError("Student not found", 404);
  const next = Math.max(0, ...payments.map((p) => toNumber(p.PaymentID.replace(/\D/g, "")))) + 1;
  const id = "PAY-" + String(next).padStart(4, "0");
  await appendRows("Payments", [
    {
      PaymentID: id,
      Date: input.date,
      StudentID: s.StudentID,
      FullName: s.FullName,
      Amount: input.amount,
      Method: input.method,
      Note: input.note,
      RecordedAt: nowStamp(),
    },
  ]);
  return { id };
}
