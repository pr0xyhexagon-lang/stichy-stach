/**
 * App-level UI kit built on shadcn/ui primitives (components/ui/*).
 * Pages import from here so the look stays consistent everywhere.
 */
import Image from "next/image";
import { cloneElement, isValidElement } from "react";
import type { ComponentProps, ReactElement, ReactNode, SelectHTMLAttributes } from "react";
import { AlertCircleIcon, CheckCircle2Icon, ChevronDownIcon, InfoIcon, PhoneIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert as UiAlert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button as UiButton } from "@/components/ui/button";
import { Card as UiCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input as UiInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea as UiTextarea } from "@/components/ui/textarea";
import { RadioCards } from "@/components/radio-cards";

export { RadioCards };
export { Checkbox } from "@/components/ui/checkbox";

/** Kept for existing call sites; same as `cn`. */
export const cx = cn;

export function BrandHeader({ batch, compact }: { batch?: string; compact?: boolean }) {
  return (
    <header className={cn("text-center", compact ? "py-3" : "py-5 sm:py-8")}>
      {/* The logo already contains the name, so the <h1> is for screen readers / SEO only. */}
      <h1 className="sr-only">Stichy Stash</h1>
      <Image
        src="/logo.png"
        alt="Stichy Stash logo"
        width={640}
        height={640}
        priority
        className={cn("mx-auto h-auto drop-shadow-sm", compact ? "w-24" : "w-36 sm:w-44")}
      />
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">Hand Embroidery Academy / Classes</p>
      <a
        href="tel:0703099433"
        className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-accent"
      >
        <PhoneIcon className="size-3.5" aria-hidden />
        070 309 9433
      </a>
      {batch && (
        <div className="mt-3">
          <Badge variant="secondary" className="h-7 px-3 text-sm font-semibold">
            Batch No: {batch}
          </Badge>
        </div>
      )}
    </header>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <UiCard className={cn("gap-0 p-5 shadow-sm sm:p-6", className)}>{children}</UiCard>;
}

export function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <UiCard className="stitched gap-0 py-0 shadow-sm ring-0">
      <CardHeader className="px-4 pt-5 sm:px-6 sm:pt-6">
        <CardTitle className="flex items-center gap-2.5 font-sans text-base font-semibold sm:text-lg">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
          {title}
        </CardTitle>
        {hint && <CardDescription className="sm:pl-9.5">{hint}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5 px-4 pt-5 pb-5 sm:px-6 sm:pb-6">{children}</CardContent>
    </UiCard>
  );
}

export function Field({ label, error, required, children, hint }: { label: string; error?: string; required?: boolean; children: ReactNode; hint?: ReactNode }) {
  // Link the <label> to its control, and the hint/error to it via aria-describedby.
  const id = "f-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const msgId = `${id}-msg`;
  const hasMsg = !!error || !!hint;
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>, {
        id,
        "aria-invalid": !!error || undefined,
        "aria-describedby": hasMsg ? msgId : undefined,
      })
    : children;
  return (
    <div className="grid gap-2">
      <Label id={`${id}-label`} htmlFor={id} className="leading-snug">
        <span>
          {label} {required && <span className="text-primary" aria-hidden>*</span>}
        </span>
      </Label>
      {child}
      {error ? (
        <p id={msgId} className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
          <AlertCircleIcon className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && <p id={msgId} className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// Inputs: 44px tall on phones (comfortable touch target), 40px from `sm` up.
const fieldSize = "h-11 rounded-lg px-3 text-base sm:h-10 md:text-sm";

// iOS Safari gives date inputs an intrinsic width/centered text that can overflow narrow screens.
const dateFix = "block appearance-none text-left [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:min-h-[1.5em]";

export function Input({ invalid, className, ...p }: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <UiInput
      {...p}
      aria-invalid={p["aria-invalid"] ?? (invalid || undefined)}
      className={cn(fieldSize, "bg-card", (p.type === "date" || p.type === "time") && dateFix, className)}
    />
  );
}

export function Textarea({ invalid, className, ...p }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <UiTextarea
      {...p}
      aria-invalid={p["aria-invalid"] ?? (invalid || undefined)}
      className={cn("min-h-20 rounded-lg bg-card px-3 py-2.5 text-base md:text-sm", className)}
    />
  );
}

/** Native <select> styled like a shadcn input (keeps the familiar onChange(e.target.value) API and native mobile pickers). */
export function Select({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        {...p}
        className={cn(
          fieldSize,
          "w-full min-w-0 cursor-pointer appearance-none border border-input bg-card pr-9 transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        )}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

const VARIANT = { primary: "default", secondary: "outline", ghost: "ghost" } as const;

export function Button({
  variant = "primary",
  className,
  ...p
}: Omit<ComponentProps<typeof UiButton>, "variant"> & { variant?: keyof typeof VARIANT }) {
  return (
    <UiButton
      {...p}
      variant={VARIANT[variant]}
      className={cn("h-10 gap-2 px-4 font-semibold", variant === "secondary" && "bg-card", className)}
    />
  );
}

const ALERT_STYLE = {
  error: { variant: "destructive" as const, cls: "border-destructive/30 bg-destructive/5", Icon: AlertCircleIcon },
  success: { variant: "default" as const, cls: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2Icon },
  info: { variant: "default" as const, cls: "border-sky-200 bg-sky-50 text-sky-800", Icon: InfoIcon },
};

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  const s = ALERT_STYLE[kind];
  return (
    <UiAlert variant={s.variant} className={cn("px-4 py-3", s.cls)} role={kind === "error" ? "alert" : "status"}>
      <s.Icon />
      <AlertDescription className="text-current">{children}</AlertDescription>
    </UiAlert>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "red" | "green" }) {
  return (
    <UiCard className="min-w-0 gap-1 px-3 py-3 shadow-xs sm:px-4 sm:py-4">
      <div className="truncate text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">{label}</div>
      <div
        className={cn(
          "text-sm font-bold break-words tabular-nums min-[380px]:text-base sm:text-xl",
          tone === "red" && "text-destructive",
          tone === "green" && "text-emerald-600"
        )}
      >
        {value}
      </div>
    </UiCard>
  );
}
