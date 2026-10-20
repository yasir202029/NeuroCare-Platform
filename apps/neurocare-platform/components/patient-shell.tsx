"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

const nav = [
  { href: "/patient", label: "Home" },
  { href: "/patient/book", label: "Appointments" },
  { href: "/patient/questionnaires", label: "Questionnaires" },
  { href: "/patient/journey", label: "My journey" },
  { href: "/documents", label: "Documents" },
  { href: "/notifications", label: "Messages" },
  { href: "/onboarding", label: "My details" },
];

/**
 * Patient navigation — calm, task-oriented, patient-only destinations.
 * Clinical, admin and finance destinations are never rendered here.
 */
export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--clarity-bg-canvas))", color: "hsl(var(--clarity-text-primary))" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          padding: "14px 24px",
          background: "hsl(var(--clarity-bg-surface))",
          borderBottom: "1px solid hsl(var(--clarity-border-default))",
        }}
      >
        <Link
          href="/patient"
          style={{ textDecoration: "none", color: "hsl(var(--clarity-text-primary))", fontWeight: 800, fontSize: 20 }}
        >
          NeuroCare
        </Link>
        <nav aria-label="Patient sections" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                style={{
                  textDecoration: "none",
                  color: active ? "hsl(var(--clarity-action-primary))" : "hsl(var(--clarity-text-secondary))",
                  background: active ? "hsl(var(--clarity-action-primary) / 0.1)" : "transparent",
                  fontWeight: active ? 700 : 500,
                  fontSize: 15,
                  padding: "8px 12px",
                  borderRadius: "var(--clarity-radius-md)",
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <NotificationBell />
      </header>
      <main id="main" style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 64px" }}>
        {children}
      </main>
    </div>
  );
}
