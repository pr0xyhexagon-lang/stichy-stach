"use client";

import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/** shadcn RadioGroup rendered as tappable option cards that reflow by screen width. */
export function RadioCards<T extends string>({
  id,
  name,
  options,
  value,
  onChange,
  invalid,
  ...aria
}: {
  id?: string;
  name: string;
  options: readonly T[];
  value: T | "";
  onChange: (v: T) => void;
  invalid?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const isInvalid = invalid || aria["aria-invalid"];
  return (
    <RadioGroup
      id={id}
      name={name}
      value={value || null}
      onValueChange={(v) => onChange(v as T)}
      aria-invalid={isInvalid || undefined}
      aria-describedby={aria["aria-describedby"]}
      aria-labelledby={id ? `${id}-label` : undefined}
      className={cn(
        "grid-cols-1 gap-2.5",
        options.length > 2 ? "sm:grid-cols-3" : "min-[420px]:grid-cols-2"
      )}
    >
      {options.map((o) => (
        <label
          key={o}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-sm leading-snug transition-colors select-none",
            "hover:border-brand-200 hover:bg-accent/60",
            "has-data-checked:border-primary has-data-checked:bg-accent has-data-checked:font-medium has-data-checked:text-accent-foreground",
            "has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
            isInvalid && "border-destructive/50"
          )}
        >
          <RadioGroupItem value={o} className="bg-card" />
          <span>{o}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
