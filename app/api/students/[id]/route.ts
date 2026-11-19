import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { updateStudent } from "@/lib/data";
import { studentPatchSchema } from "@/lib/schema";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  await updateStudent(decodeURIComponent(id), studentPatchSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
