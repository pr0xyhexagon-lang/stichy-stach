// Small helpers safe to use on both server and client.

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Colombo";

/** Today's date as YYYY-MM-DD in the academy's timezone. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function nowStamp(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

export function ageFromDob(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const [ty, tm, td] = todayISO().split("-").map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age--;
  return age >= 0 && age < 130 ? age : null;
}

export function money(n: number): string {
  return "Rs. " + (Number.isFinite(n) ? n : 0).toLocaleString("en-LK", { maximumFractionDigits: 2 });
}

export function toNumber(v: string | number | undefined): number {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
