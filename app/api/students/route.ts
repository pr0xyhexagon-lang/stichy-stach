import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getSettings, listStudents } from "@/lib/data";

export const GET = handle(async () => {
  const [students, settings] = await Promise.all([listStudents(), getSettings()]);
  const batches = Array.from(new Set([settings.currentBatch, ...students.map((s) => s.batch)].filter(Boolean)));
  return NextResponse.json({ students, batches, currentBatch: settings.currentBatch });
});
