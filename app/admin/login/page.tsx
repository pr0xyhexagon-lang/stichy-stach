"use client";

import { useState, type FormEvent } from "react";
import { Alert, BrandHeader, Button, Card, Field, Input } from "@/components/kit";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError((await res.json().catch(() => ({}))).error ?? "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pb-16">
      <BrandHeader />
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Admin login</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" disabled={busy || !password} className="h-11 w-full sm:h-10">
            {busy ? "Checking…" : "Log in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
