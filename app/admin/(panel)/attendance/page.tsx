"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Field, Input, Select, cx } from "@/components/kit";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/format";
import type { AttendanceSheet, StudentsResponse } from "@/lib/types";

type Status = "Present" | "Absent";

export default function AttendancePage() {
  const [batches, setBatches] = useState<string[]>([]);
  const [batch, setBatch] = useState("");
  const [date, setDate] = useState(todayISO());
  const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    api<StudentsResponse>("/api/students")
      .then((d) => {
        setBatches(d.batches);
        setBatch(d.currentBatch);
      })
      .catch((e) => setMsg({ kind: "error", text: e.message }));
  }, []);

  useEffect(() => {
    if (!batch || !date) return;
    let cancelled = false;
    setLoading(true);
    setMsg(null);
    api<AttendanceSheet>(`/api/attendance?date=${date}&batch=${encodeURIComponent(batch)}`)
      .then((s) => {
        if (cancelled) return;
        setSheet(s);
        // Saved marks are loaded as-is; new sheets default everyone to Present.
        setMarks(Object.fromEntries(s.rows.map((r) => [r.studentId, r.status ?? "Present"])));
      })
      .catch((e) => !cancelled && setMsg({ kind: "error", text: e.message }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [batch, date]);

  const setAll = (s: Status) => setMarks(Object.fromEntries(Object.keys(marks).map((k) => [k, s])));
  const presentCount = Object.values(marks).filter((s) => s === "Present").length;

  async function save() {
    if (!sheet) return;
    setSaving(true);
    setMsg(null);
    try {
      const updated = await api<AttendanceSheet>("/api/attendance", {
        body: { date, batch, records: sheet.rows.map((r) => ({ studentId: r.studentId, status: marks[r.studentId] })) },
      });
      setSheet(updated);
      setMsg({ kind: "success", text: `Attendance saved for ${date} (${presentCount} present).` });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Attendance</h1>

      <div className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 min-[480px]:grid-cols-2 sm:p-4">
        <Field label="Class date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Batch">
          <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
            {batches.map((b) => <option key={b}>{b}</option>)}
          </Select>
        </Field>
      </div>

      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {sheet && !loading && (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {sheet.saved ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Saved earlier — editing</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Not marked yet</span>
              )}
              <span className="font-medium text-foreground">{presentCount}/{sheet.rows.length} present</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="secondary" onClick={() => setAll("Present")}>All present</Button>
              <Button variant="secondary" onClick={() => setAll("Absent")}>All absent</Button>
            </div>
          </div>

          {sheet.rows.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">No active students in {batch}.</p>
          ) : (
            <ul className="divide-y">
              {sheet.rows.map((r) => {
                const m = marks[r.studentId];
                return (
                  <li key={r.studentId} className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{r.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{r.studentId}</span> · {r.present}/{r.sessions}<span className="hidden min-[400px]:inline"> classes attended</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-input">
                      {(["Present", "Absent"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMarks((x) => ({ ...x, [r.studentId]: s }))}
                          aria-pressed={m === s}
                          className={cx(
                            "min-h-10 px-2.5 text-sm font-medium transition-colors min-[400px]:px-3.5",
                            m === s && s === "Present" && "bg-emerald-600 text-white",
                            m === s && s === "Absent" && "bg-red-600 text-white",
                            m !== s && "bg-card text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {sheet.rows.length > 0 && (
            <div className="sticky bottom-[calc(3.5rem+1px+env(safe-area-inset-bottom))] z-10 rounded-b-xl border-t bg-card/95 p-3 backdrop-blur md:static md:bottom-auto md:p-4 md:backdrop-blur-none">
              <Button onClick={save} disabled={saving} className="h-11 w-full md:h-10 md:w-auto">
                {saving ? "Saving…" : sheet.saved ? "Update attendance" : "Save attendance"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
