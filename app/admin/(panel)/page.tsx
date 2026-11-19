"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircleIcon, PlusIcon, RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";
import { Alert, Button, Checkbox, Field, Input, Select, Stat, cx } from "@/components/kit";
import { api } from "@/lib/client";
import { money } from "@/lib/format";
import { STUDENT_STATUS } from "@/lib/schema";
import type { StudentSummary, StudentsResponse } from "@/lib/types";

export default function StudentsPage() {
  const [data, setData] = useState<StudentsResponse | null>(null);
  const [error, setError] = useState("");
  const [batch, setBatch] = useState("All");
  const [search, setSearch] = useState("");
  const [duesOnly, setDuesOnly] = useState(false);
  const [selected, setSelected] = useState<StudentSummary | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api<StudentsResponse>("/api/students"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.students ?? [])
      .filter((s) => batch === "All" || s.batch === batch)
      .filter((s) => !duesOnly || s.due > 0)
      .filter((s) => !q || s.fullName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.whatsapp.includes(q));
  }, [data, batch, search, duesOnly]);

  const totals = rows.reduce((t, s) => ({ fee: t.fee + s.courseFee, paid: t.paid + s.paid, due: t.due + s.due }), { fee: 0, paid: 0, due: 0 });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Students</h1>
        <Button variant="secondary" onClick={load} aria-label="Refresh">
          <RefreshCwIcon className="size-4" aria-hidden />
          <span className="hidden min-[380px]:inline">Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Stat label="Students" value={rows.length} />
        <Stat label="Total fees" value={money(totals.fee)} />
        <Stat label="Collected" value={money(totals.paid)} tone="green" />
        <Stat label="Due" value={money(totals.due)} tone={totals.due > 0 ? "red" : undefined} />
      </div>

      <div className="grid gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-center sm:gap-3">
        <div className="relative sm:col-start-1 sm:row-start-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Search name, ID or phone"
            aria-label="Search students"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:contents">
          <Select value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Filter by batch">
            <option value="All">All batches</option>
            {data?.batches.map((b) => <option key={b}>{b}</option>)}
          </Select>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm whitespace-nowrap text-foreground/80">
            <Checkbox checked={duesOnly} onCheckedChange={(v) => setDuesOnly(v === true)} className="size-5" />
            Dues only
          </label>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {!data && !error && <p className="text-muted-foreground">Loading from Google Sheets…</p>}

      {/* Phones & tablets: tappable cards (2 columns on tablets) */}
      {data && (
        <ul className="grid gap-2 sm:grid-cols-2 lg:hidden">
          {rows.length === 0 && <li className="rounded-xl bg-card p-6 text-center sm:col-span-2 text-sm text-muted-foreground ring-1 ring-foreground/10">No students found.</li>}
          {rows.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="w-full rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:bg-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{s.fullName}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{s.id}</span>
                      <span>· {s.batch}</span>
                      {s.status !== "Active" && <span className="rounded bg-muted px-1.5 py-0.5 text-foreground/70">{s.status}</span>}
                    </div>
                  </div>
                  <div className={cx("shrink-0 text-right text-sm font-bold tabular-nums", s.due > 0 ? "text-destructive" : "text-emerald-600")}>
                    {s.due > 0 ? money(s.due) : "Paid ✓"}
                    {s.due > 0 && <div className="text-[0.7rem] font-medium text-muted-foreground">due</div>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                  <span>{s.whatsapp}</span>
                  <span>{s.classMode.startsWith("In-person") ? "Physical" : s.classMode}</span>
                  <span>Attendance {s.sessions ? `${s.present}/${s.sessions}` : "—"}</span>
                  <span>Paid <span className="text-emerald-700">{money(s.paid)}</span> / {money(s.courseFee)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Laptop / desktop: full table */}
      {data && (
        <div className="hidden overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10 lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3 text-right">Fee</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No students found.</td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer hover:bg-accent">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.fullName}</div>
                    <div className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {s.id}
                      {s.status !== "Active" && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-sans text-foreground/70">{s.status}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.batch}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.whatsapp}</td>
                  <td className="px-4 py-3">{s.classMode.startsWith("In-person") ? "Physical" : s.classMode}</td>
                  <td className="px-4 py-3">{s.sessions ? `${s.present}/${s.sessions}` : "—"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{money(s.courseFee)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums text-emerald-700">{money(s.paid)}</td>
                  <td className={cx("px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums", s.due > 0 ? "text-destructive" : "text-emerald-600")}>
                    {s.due > 0 ? money(s.due) : "Paid ✓"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <StudentDrawer
          student={selected}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

const DETAIL_FIELDS: [string, string][] = [
  ["RegisteredAt", "Registered"],
  ["DOB", "Date of birth"],
  ["Age", "Age"],
  ["WhatsApp", "WhatsApp"],
  ["Address", "Address"],
  ["SkillLevel", "Skill level"],
  ["ClassMode", "Class mode"],
  ["PreferredDays", "Preferred days"],
  ["StarterKit", "Starter kit"],
  ["EmergencyName", "Emergency contact"],
  ["EmergencyPhone", "Emergency phone"],
  ["SignatureName", "Signed as"],
  ["SignatureDate", "Signed on"],
];

function StudentDrawer({ student, onClose, onSaved }: { student: StudentSummary; onClose: () => void; onSaved: () => void }) {
  const [fee, setFee] = useState(String(student.courseFee));
  const [status, setStatus] = useState(student.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api(`/api/students/${encodeURIComponent(student.id)}`, { method: "PATCH", body: { courseFee: fee, status } });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  // Esc closes; lock page scroll behind the sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const actionLink =
    "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ring-1 transition-colors sm:h-10 sm:flex-none";

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 md:items-stretch md:justify-end" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-drawer-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl md:h-full md:max-h-none md:max-w-md md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle (phones) */}
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted md:hidden" aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 id="student-drawer-title" className="truncate text-lg font-bold text-foreground sm:text-xl">{student.fullName}</h2>
            <p className="truncate font-mono text-sm text-muted-foreground">{student.id} · {student.batch}</p>
          </div>
          <button onClick={onClose} className="-mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Close">
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5">
        <div className="mb-5 grid grid-cols-3 gap-2 text-center">
          <div className="min-w-0 rounded-lg bg-muted p-2"><div className="text-xs text-muted-foreground">Paid</div><div className="text-sm font-semibold break-words text-emerald-700 sm:text-base">{money(student.paid)}</div></div>
          <div className="min-w-0 rounded-lg bg-muted p-2"><div className="text-xs text-muted-foreground">Due</div><div className={cx("text-sm font-semibold break-words sm:text-base", student.due > 0 ? "text-destructive" : "text-emerald-600")}>{money(student.due)}</div></div>
          <div className="min-w-0 rounded-lg bg-muted p-2"><div className="text-xs text-muted-foreground">Attendance</div><div className="text-sm font-semibold sm:text-base">{student.present}/{student.sessions}</div></div>
        </div>

        <dl className="mb-5 divide-y text-sm">
          {DETAIL_FIELDS.map(([k, label]) => (
            <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words text-foreground">{student.details[k] || "—"}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-3 rounded-xl bg-muted/60 p-4">
          <h3 className="font-semibold text-foreground">Edit</h3>
          <div className="grid gap-3 min-[380px]:grid-cols-2">
            <Field label="Course fee (Rs.)">
              <Input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STUDENT_STATUS.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={busy} className="h-11 w-full sm:h-10 sm:w-auto">{busy ? "Saving…" : "Save changes"}</Button>
            <Link href={`/admin/payments?student=${encodeURIComponent(student.id)}`} className={cx(actionLink, "bg-card text-brand-700 ring-brand-200 hover:bg-accent")}>
              <PlusIcon className="size-4" aria-hidden /> Payment
            </Link>
            <a href={`https://wa.me/${waNumber(student.whatsapp)}`} target="_blank" rel="noreferrer" className={cx(actionLink, "bg-card text-emerald-700 ring-emerald-200 hover:bg-emerald-50")}>
              <MessageCircleIcon className="size-4" aria-hidden /> WhatsApp
            </a>
          </div>
        </div>
        </div>
      </aside>
    </div>
  );
}

/** 0701234567 -> 94701234567 (Sri Lanka) for wa.me links */
function waNumber(p: string) {
  const d = p.replace(/\D/g, "");
  return d.startsWith("0") ? "94" + d.slice(1) : d;
}
