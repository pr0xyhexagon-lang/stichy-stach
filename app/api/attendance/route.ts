import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { AppError, getAttendance, saveAttendance } from "@/lib/data";
import { attendanceSchema } from "@/lib/schema";

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  const batch = url.searchParams.get("batch") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !batch) throw new AppError("date and batch are required");
  return NextResponse.json(await getAttendance(date, batch));
});

export const POST = handle(async (req: Request) => {
  const data = attendanceSchema.parse(await req.json());
  await saveAttendance(data);
  return NextResponse.json(await getAttendance(data.date, data.batch));
});
