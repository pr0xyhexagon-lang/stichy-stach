"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Field, Input } from "@/components/kit";
import { api, ApiError } from "@/lib/client";

interface Settings {
  currentBatch: string;
  courseFee: number | string;
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    api<Settings>("/api/settings").then(setS).catch((e) => setMsg({ kind: "error", text: e.message }));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    setBusy(true);
    setErrors({});
    setMsg(null);
    try {
      setS(await api<Settings>("/api/settings", { method: "PUT", body: s }));
      setMsg({ kind: "success", text: "Settings saved. New registrations will use these values." });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setMsg({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 md:mx-0">
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Settings</h1>
      {!s && !msg && <p className="text-muted-foreground">Loading…</p>}
      {s && (
        <form onSubmit={save} className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
          <Field label="Current batch (shown on the registration form)" error={errors.currentBatch} hint='e.g. "Batch 02". New students are added to this batch.'>
            <Input value={s.currentBatch} onChange={(e) => setS({ ...s, currentBatch: e.target.value })} />
          </Field>
          <Field label="Full course fee (Rs.)" error={errors.courseFee} hint="Shown on the registration form. The starter kit is included free.">
            <Input type="number" min={0} inputMode="numeric" value={s.courseFee} onChange={(e) => setS({ ...s, courseFee: e.target.value })} />
          </Field>
          <p className="text-xs text-muted-foreground">Changing fees only affects new registrations. Edit an existing student&apos;s fee from the Students page.</p>
          {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          <Button type="submit" disabled={busy} className="h-11 w-full sm:h-10 sm:w-auto">{busy ? "Saving…" : "Save settings"}</Button>
        </form>
      )}
      {!s && msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
    </div>
  );
}
