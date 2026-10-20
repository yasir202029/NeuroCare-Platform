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

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc", color: "#15233a" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          background: "#ffffff",
          borderBottom: "1px solid #e4ebf3",
        }}
      >
        <Link href="/patient" style={{ textDecoration: "none", color: "#15233a", fontWeight: 800, fontSize: 22 }}>
          NeuroCare
        </Link>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                textDecoration: "none",
                color: pathname === n.href ? "#4e6ef2" : "#4c5d7a",
                fontWeight: pathname === n.href ? 700 : 500,
                fontSize: 14,
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <NotificationBell />
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>{children}</main>
    </div>
  );
}
