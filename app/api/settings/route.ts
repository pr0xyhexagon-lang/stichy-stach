import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getSettings, saveSettings } from "@/lib/data";
import { settingsSchema } from "@/lib/schema";

// Admin-only (see middleware.ts)
export const GET = handle(async () => NextResponse.json(await getSettings()));

export const PUT = handle(async (req: Request) => {
  const data = settingsSchema.parse(await req.json());
  await saveSettings(data);
  return NextResponse.json(await getSettings());
});
