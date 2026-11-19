"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Checkbox, Field, Input, RadioCards, Section, Textarea } from "@/components/kit";
import { Loader2Icon } from "lucide-react";
import {
  CLASS_MODES,
  DECLARATION,
  PREFERRED_DAYS,
  SKILL_LEVELS,
  STARTER_KIT,
  fieldErrors,
  registrationSchema,
} from "@/lib/schema";
import { ageFromDob, todayISO } from "@/lib/format";
import { api, ApiError } from "@/lib/client";

const EMPTY = {
  fullName: "",
  dob: "",
  whatsapp: "",
  address: "",
  skillLevel: "" as (typeof SKILL_LEVELS)[number] | "",
  classMode: "" as (typeof CLASS_MODES)[number] | "",
  preferredDays: "" as (typeof PREFERRED_DAYS)[number] | "",
  starterKit: "" as (typeof STARTER_KIT)[number] | "",
  emergencyName: "",
  emergencyPhone: "",
  agreed: false,
};

export default function RegistrationForm({ batch }: { batch: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const age = ageFromDob(form.dob);
  const physical = form.classMode === "In-person (Physical)";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ id: string; batch: string }>("/api/register", { body: parsed.data });
      const q = new URLSearchParams({ id: res.id, name: parsed.data.fullName, batch: res.batch });
      router.push(`/success?${q}`);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setServerError(err instanceof Error ? err.message : "Could not submit. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 sm:space-y-6">
      <Section n={1} title="Student Details">
        <div data-field="fullName">
          <Field label="Full Name" required error={errors.fullName}>
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" invalid={!!errors.fullName} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div data-field="dob">
            <Field label="Date of Birth" required error={errors.dob} hint={age !== null ? `Age: ${age} years` : undefined}>
              <Input type="date" max={todayISO()} value={form.dob} onChange={(e) => set("dob", e.target.value)} invalid={!!errors.dob} />
            </Field>
          </div>
          <div data-field="whatsapp">
            <Field label="Contact / WhatsApp No" required error={errors.whatsapp}>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="07X XXX XXXX"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                autoComplete="tel"
                invalid={!!errors.whatsapp}
              />
            </Field>
          </div>
        </div>
        <div data-field="address">
          <Field label="Address" required error={errors.address}>
            <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" invalid={!!errors.address} />
          </Field>
        </div>
      </Section>

      <Section n={2} title="Course Details">
        <div data-field="skillLevel">
          <Field label="Skill Level" required error={errors.skillLevel}>
            <RadioCards name="skillLevel" options={SKILL_LEVELS} value={form.skillLevel} onChange={(v) => set("skillLevel", v)} invalid={!!errors.skillLevel} />
          </Field>
        </div>
        <div data-field="classMode">
          <Field label="Class Mode" required error={errors.classMode}>
            <RadioCards name="classMode" options={CLASS_MODES} value={form.classMode} onChange={(v) => set("classMode", v)} invalid={!!errors.classMode} />
          </Field>
        </div>
        <div data-field="preferredDays">
          <Field label="Preferred Days" required error={errors.preferredDays}>
            <RadioCards name="preferredDays" options={PREFERRED_DAYS} value={form.preferredDays} onChange={(v) => set("preferredDays", v)} invalid={!!errors.preferredDays} />
          </Field>
        </div>
        <div data-field="starterKit">
          <Field label="Starter Kit Needed?" required error={errors.starterKit}>
            <RadioCards name="starterKit" options={STARTER_KIT} value={form.starterKit} onChange={(v) => set("starterKit", v)} invalid={!!errors.starterKit} />
          </Field>
        </div>
      </Section>

      <Section
        n={3}
        title="Emergency Contact"
        hint={physical ? "Recommended for physical classes. Parent / Guardian / Spouse." : "Optional — mainly for physical classes."}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parent / Guardian / Spouse Name" error={errors.emergencyName}>
            <Input value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} />
          </Field>
          <div data-field="emergencyPhone">
            <Field label="Phone No" error={errors.emergencyPhone}>
              <Input type="tel" inputMode="tel" value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} invalid={!!errors.emergencyPhone} />
            </Field>
          </div>
        </div>
      </Section>

      <Section n={4} title="Terms & Declaration">
        <div data-field="agreed">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-accent p-3.5 text-sm leading-relaxed text-foreground/80 transition-colors sm:p-4 ${
              errors.agreed ? "border-destructive/50" : "border-transparent"
            }`}
          >
            <Checkbox
              checked={form.agreed}
              onCheckedChange={(v) => set("agreed", v === true)}
              aria-invalid={!!errors.agreed || undefined}
              className="mt-0.5 size-5 bg-card"
            />
            <span>&ldquo;{DECLARATION}&rdquo;</span>
          </label>
          {errors.agreed && <p className="mt-2 text-sm text-destructive" role="alert">{errors.agreed}</p>}
        </div>
      </Section>

      {serverError && <Alert>{serverError}</Alert>}

      {/* Sticky on phones so the submit button is always reachable; inline on larger screens. */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button type="submit" disabled={submitting} className="h-12 w-full text-base shadow-sm">
          {submitting && <Loader2Icon className="animate-spin" aria-hidden />}
          {submitting ? "Submitting…" : `Register for ${batch}`}
        </Button>
      </div>
    </form>
  );
}
