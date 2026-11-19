// Shapes returned by the API (kept free of server imports so client pages can use them).

export interface StudentSummary {
  id: string;
  fullName: string;
  batch: string;
  status: string;
  whatsapp: string;
  classMode: string;
  starterKit: string;
  courseFee: number;
  paid: number;
  due: number;
  present: number;
  sessions: number;
  details: Record<string, string>;
}

export interface StudentsResponse {
  students: StudentSummary[];
  batches: string[];
  currentBatch: string;
}

export interface Payment {
  id: string;
  date: string;
  studentId: string;
  fullName: string;
  amount: number;
  method: string;
  note: string;
}

export interface AttendanceSheet {
  date: string;
  batch: string;
  saved: boolean;
  rows: { studentId: string; fullName: string; status: "Present" | "Absent" | null; present: number; sessions: number }[];
}
