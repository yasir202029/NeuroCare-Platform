"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

export type ClinicianSection = {
  id: string;
  label: string;
  hint: string;
};

/**
 * Clinician workstation navigation.
 * Deliberately excludes organisation billing, staff management, platform
 * analytics, subscription management and global configuration — those belong
 * to the admin operations workstation.
 */
export const clinicianSections: ClinicianSection[] = [
  { id: "home", label: "Home", hint: "What needs my attention today" },
  { id: "schedule", label: "Schedule", hint: "Today's encounters and upcoming work" },
  { id: "patients", label: "Patients", hint: "My caseload" },
  { id: "assessments", label: "Assessments", hint: "Assessments in progress" },
  { id: "treatment", label: "Treatment", hint: "Titration and review work" },
  { id: "tasks", label: "Tasks", hint: "Clinical tasks and follow-ups" },
  { id: "messages", label: "Messages", hint: "Patient correspondence" },
  { id: "documents", label: "Documents", hint: "Evidence and letters" },
  { id: "reports", label: "Reports", hint: "Draft and approve reports" },
];

export function ClinicianShell({
  active,
  onSelect,
  children,
}: {
  active: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="clinic-shell">
      <aside className="clinic-nav">
        <div className="brand">
          <span aria-hidden="true">n</span>
          <div>
            <b>NeuroCare</b>
            <small>Clinician workstation</small>
          </div>
        </div>
        <nav aria-label="Clinician sections">
          {clinicianSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={active === section.id ? "active" : undefined}
              aria-current={active === section.id ? "page" : undefined}
              onClick={() => {
                onSelect(section.id);
                setMobileNavOpen(false);
              }}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <p className="nav-note">
          Access is role-scoped and audited. Records shown are limited to patients assigned to you.
        </p>
      </aside>
      <div>
        <button
          type="button"
          className="clinic-mobile-toggle"
          aria-expanded={mobileNavOpen}
          aria-controls="clinician-mobile-nav"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? "Close navigation" : "Navigation"}
        </button>
        <main className="clinic-content" id="main" data-path={pathname}>
          {children}
        </main>
      </div>
    </div>
  );
}
