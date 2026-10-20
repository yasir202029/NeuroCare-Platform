"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearAccessToken } from "../lib/session";
export type AdminSection = {
  id: string;
  label: string;
  hint: string;
};

/**
 * Admin operations navigation.
 * Deliberately excludes the clinician longitudinal patient workspace —
 * administrative access does not imply clinical-content access.
 */
export const adminSections: AdminSection[] = [
  { id: "operations", label: "Operations", hint: "What is blocked right now" },
  { id: "pipeline", label: "Patient pipeline", hint: "Where patients are in the pathway" },
  { id: "queues", label: "Operational tasks", hint: "Queues awaiting an owner" },
  { id: "access", label: "Users & access", hint: "Staff accounts and permissions" },
  { id: "audit", label: "Audit", hint: "Governed activity trail" },
  { id: "reporting", label: "Reporting", hint: "Operational reporting" },
];

export function AdminShell({
  active,
  onSelect,
  children,
}: {
  active: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The local session is cleared regardless of the upstream response.
    } finally {
      clearAccessToken();
      setSigningOut(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="ops-shell">
      <aside className="ops-nav">
        <div className="brand">
          <span aria-hidden="true">n</span>
          <div>
            <b>NeuroCare</b>
            <small>Operations workstation</small>
          </div>
        </div>
        <nav aria-label="Admin sections">
          {adminSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={active === section.id ? "active" : undefined}
              aria-current={active === section.id ? "page" : undefined}
              onClick={() => onSelect(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <p className="nav-note">
          Operational access only. Clinical content is not exposed here; clinical access is granted
          through assigned-patient permissions.
        </p>
        <button type="button" className="ops-signout" onClick={() => void signOut()} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </aside>
      <main className="ops-content" id="main">{children}</main>
    </div>
  );
}
