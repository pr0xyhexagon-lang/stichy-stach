"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, Field, Input, Select, Stat, cx } from "@/components/kit";
import { api, ApiError } from "@/lib/client";
import { money, todayISO } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/schema";
import type { Payment, StudentsResponse } from "@/lib/types";

export default function PaymentsPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <Payments />
    </Suspense>
  );
}

function Payments() {
  const params = useSearchParams();
  const [data, setData] = useState<StudentsResponse | null>(null);
  const [studentId, setStudentId] = useState(params.get("student") ?? "");
  const [history, setHistory] = useState<Payment[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const loadStudents = useCallback(() => api<StudentsResponse>("/api/students").then(setData), []);
  useEffect(() => {
    loadStudents().catch((e) => setMsg({ kind: "error", text: e.message }));
  }, [loadStudents]);

  const loadHistory = useCallback(async (id: string) => {
    if (!id) return setHistory([]);
    const r = await api<{ payments: Payment[] }>(`/api/payments?studentId=${encodeURIComponent(id)}`);
    setHistory(r.payments);
  }, []);
  useEffect(() => {
    loadHistory(studentId).catch((e) => setMsg({ kind: "error", text: e.message }));
  }, [studentId, loadHistory]);

  const student = data?.students.find((s) => s.id === studentId);

  // Picking from the dues list: on phones the form is above the list, so bring it into view.
  function pick(id: string) {
    setStudentId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("payment-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  const withDues = useMemo(() => (data?.students ?? []).filter((s) => s.due > 0).sort((a, b) => b.due - a.due), [data]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    try {
      const r = await api<{ id: string }>("/api/payments", { body: { studentId, amount, date, method, note } });
      setMsg({ kind: "success", text: `Payment ${r.id} of ${money(Number(amount))} recorded for ${student?.fullName}.` });
      setAmount("");
      setNote("");
      await Promise.all([loadStudents(), loadHistory(studentId)]);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Payments</h1>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <form id="payment-form" onSubmit={submit} className="scroll-mt-20 space-y-4 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-5">
            <Field label="Student" required error={errors.studentId}>
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">— Select a student —</option>
                {data?.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.id}){s.due > 0 ? ` — due ${money(s.due)}` : ""}
                  </option>
                ))}
              </Select>
            </Field>

            {student && (
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Fee" value={money(student.courseFee)} />
                <Stat label="Paid" value={money(student.paid)} tone="green" />
                <Stat label="Due" value={money(student.due)} tone={student.due > 0 ? "red" : "green"} />
              </div>
            )}

            <div className="grid gap-4 min-[480px]:grid-cols-2 md:grid-cols-3">
              <Field label="Amount (Rs.)" required error={errors.amount}>
                <Input type="number" min={1} step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Date" required error={errors.date}>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Method">
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 1st installment, kit payment" />
            </Field>
            {student && student.due > 0 && (
              <button type="button" onClick={() => setAmount(String(student.due))} className="min-h-10 text-left text-sm font-medium text-primary hover:underline">
                Fill full due amount ({money(student.due)})
              </button>
            )}
            {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
            <Button type="submit" disabled={busy || !studentId || !amount} className="h-11 w-full sm:h-10 sm:w-auto">
              {busy ? "Saving…" : "Record payment"}
            </Button>
          </form>

          {student && (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <h2 className="border-b px-3 py-3 font-semibold text-foreground sm:px-4">Payment history — {student.fullName}</h2>
              {history.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {history.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{p.date} · {p.method}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-mono">{p.id}</span>
                          {p.note && ` · ${p.note}`}
                        </div>
                      </div>
                      <div className="shrink-0 font-semibold tabular-nums text-emerald-700">{money(p.amount)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl bg-card ring-1 ring-foreground/10">
          <h2 className="border-b px-3 py-3 font-semibold text-foreground sm:px-4">
            Outstanding dues <span className="text-sm font-normal text-muted-foreground">({withDues.length})</span>
          </h2>
          {withDues.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Everyone is fully paid 🎉</p>
          ) : (
            <ul className="max-h-[60dvh] divide-y overflow-y-auto overscroll-contain text-sm lg:max-h-[480px]">
              {withDues.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => pick(s.id)}
                    className={cx("flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-accent sm:px-4", s.id === studentId && "bg-accent")}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{s.fullName}</span>
                      <span className="text-xs text-muted-foreground">{s.batch}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-destructive">{money(s.due)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
