"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheckIcon, LogOutIcon, SettingsIcon, UsersIcon, WalletIcon } from "lucide-react";
import { cx } from "./kit";

const LINKS = [
  { href: "/admin", label: "Students", Icon: UsersIcon },
  { href: "/admin/attendance", label: "Attendance", Icon: CalendarCheckIcon },
  { href: "/admin/payments", label: "Payments", Icon: WalletIcon },
  { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
];

export default function AdminNav() {
  const path = usePathname();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return (
    <>
      {/* Top bar: logo + (tablet/desktop) inline links + logout */}
      <header className="sticky top-0 z-20 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold text-brand-700">
            <Image src="/logo.png" alt="" width={40} height={40} className="size-9 shrink-0 sm:size-10" priority />
            <span>Stichy Stash</span>
          </Link>
          <nav className="hidden flex-1 justify-center gap-1 md:flex" aria-label="Admin">
            {LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
                className={cx(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  path === href ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <button
            onClick={logout}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:ml-0"
          >
            <LogOutIcon className="size-4" aria-hidden />
            <span className="hidden min-[380px]:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Phones: app-style bottom tab bar (thumb-reachable) */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {LINKS.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cx("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-secondary")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
