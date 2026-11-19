import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./data";
import { fieldErrors } from "./schema";

/** Wrap a route handler so errors become clean JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "Please check the highlighted fields.", fields: fieldErrors(e) },
          { status: 400 }
        );
      }
      if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json(
        { error: "Something went wrong while talking to Google Sheets. Please try again." },
        { status: 500 }
      );
    }
  };
}
