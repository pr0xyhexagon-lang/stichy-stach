import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { registerStudent } from "@/lib/data";
import { registrationSchema } from "@/lib/schema";

export const POST = handle(async (req: Request) => {
  const data = registrationSchema.parse(await req.json());
  const result = await registerStudent(data);
  return NextResponse.json(result, { status: 201 });
});
