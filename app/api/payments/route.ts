import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { addPayment, listPayments } from "@/lib/data";
import { paymentSchema } from "@/lib/schema";

export const GET = handle(async (req: Request) => {
  const studentId = new URL(req.url).searchParams.get("studentId") ?? undefined;
  return NextResponse.json({ payments: await listPayments(studentId) });
});

export const POST = handle(async (req: Request) => {
  const data = paymentSchema.parse(await req.json());
  return NextResponse.json(await addPayment(data), { status: 201 });
});
