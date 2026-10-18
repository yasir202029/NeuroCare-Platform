"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authenticatedFetch } from "../lib/client-api";
import { PortalExperience } from "./portal-experience";
import NotificationBell from "./NotificationBell";

export const portalConfig = {
  patient: {
    label: "Patient",
    roles: "PATIENT",
    title: "Your care, connected",
    summary:
      "Appointments, documents, messages, medication and billing in one private care space.",
    queues: ["Appointments", "Reports"],
    workflowTitle: "Your care plan",
    stages: [
      "Complete profile",
      "Submit ADHD intake",
      "Request appointment",
      "Attend session",
      "Message care team",
    ],
  },
  clinician: {
    label: "Clinician",
    roles: "PSYCHIATRIST · NURSE",
    title: "Clinical care, in focus",
    summary:
      "Prioritised assessments, patient context and safe handoffs for the current clinical team.",
    queues: ["Assigned patients", "Reports awaiting review"],
    workflowTitle: "Clinic session flow",
    stages: [
      "Publish availability",
      "Confirm request",
      "Start session",
      "Record attendance",
      "Complete notes",
    ],
  },
  titration: {
    label: "Titration",
    roles: "NURSE · PRESCRIBER",
    title: "Medication review, connected",
    summary:
      "Dose history, side-effect monitoring, physical health and prescriber handoff in one queue.",
    queues: ["Physical health reviews", "Open alerts"],
    workflowTitle: "Titration safety checks",
    stages: [
      "Review baseline",
      "Record dose",
      "Monitor response",
      "Check side effects",
      "Plan follow-up",
    ],
  },
  prescriber: {
    label: "Prescriber",
    roles: "PSYCHIATRIST · PRESCRIBER",
    title: "Safe prescribing, in focus",
    summary:
      "Prescription approval, issuing, dispatch and shared-care decisions with a complete audit trail.",
    queues: ["Prescriptions to review", "Physical health reviews"],
    workflowTitle: "Prescription release",
    stages: [
      "Review record",
      "Check safety",
      "Sign prescription",
      "Issue medication",
      "Handover care",
    ],
  },
  admin: {
    label: "Admin",
    roles: "ADMIN",
    title: "Clinic operations, connected",
    summary:
      "Use the NeuroCare Engine to manage patients, ownership, workflow, finance and governance.",
    queues: ["Users", "Patients", "Appointments", "Audit events"],
    workflowTitle: "Clinic operations",
    stages: [
      "Intake",
      "Triage",
      "Assign team",
      "Resolve queue",
      "Review audit",
    ],
  },
  finance: {
    label: "Finance",
    roles: "FINANCE · ADMIN",
    title: "Finance, without blind spots",
    summary:
      "Invoices, payments, earnings and service performance in the same governed platform.",
    queues: ["Invoices", "Outstanding balance (pence)", "Payments"],
    workflowTitle: "Revenue cycle",
    stages: [
      "Create invoice",
      "Collect payment",
      "Reconcile",
      "Review exceptions",
      "Close period",
    ],
  },
} as const;

export type Portal = keyof typeof portalConfig;

const nav = Object.entries(portalConfig) as [
  Portal,
  (typeof portalConfig)[Portal],
][];
const summaryFields: Record<Portal, string[]> = {
  patient: ["appointments", "reports"],
  clinician: ["patients", "pendingReports"],
  titration: ["physicalReviews", "openAlerts"],
  prescriber: ["prescriptionsToReview", "physicalReviews"],
  admin: ["users", "patients", "appointments", "auditEvents"],
  finance: ["invoices", "outstandingPence", "payments"],
};

export function PlatformShell({ portal }: { portal: Portal }) {
  const pathname = usePathname();
  const config = portalConfig[portal];
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    authenticatedFetch(
      `/api/v1/portals/${portal === "titration" ? "nurse" : portal}/summary`,
    )
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Sign in with an account assigned to this portal to load live workload.",
            );
          }
          if (response.status === 403) {
            throw new Error(
              "Your account is not authorised for this workspace. Sign in with the correct role.",
            );
          }
          throw new Error("Shared API unavailable.");
        }
        return response.json();
      })
      .then((data) => {
        if (active) {
          setSummary(data.summary);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!active) {
          return;
        }
        setSummary(null);
        setError(
          reason instanceof Error ? reason.message : "Shared API unavailable.",
        );
      });

    return () => {
      active = false;
    };
  }, [portal]);

  const cards = config.queues.map((queue, index) => ({
    title: queue,
    value: summary?.[summaryFields[portal][index]],
    hint: "Live authorised data",
  }));

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        minHeight: "100vh",
        background: "#f3f6f8",
        color: "#15233a",
      }}
    >
      <aside
        style={{
          background: "#12213f",
          color: "#f5f7ff",
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Link
          href="/patient"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "#fff",
            fontWeight: 800,
            fontSize: 26,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "#4e6ef2",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            n
          </span>
          <b>NeuroCare</b>
        </Link>

        <p
          style={{
            margin: 0,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: 11,
            opacity: 0.7,
          }}
        >
          Unified care platform
        </p>

        <nav style={{ display: "grid", gap: 6 }}>
          {nav.map(([key, item]) => (
            <Link
              key={key}
              href={`/${key}`}
              style={{
                textDecoration: "none",
                color: pathname === `/${key}` ? "#ffffff" : "#dce7ff",
                background:
                  pathname === `/${key}`
                    ? "rgba(78,110,242,0.2)"
                    : "transparent",
                borderRadius: 10,
                padding: "10px 12px",
                fontWeight: 600,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            display: "grid",
            gap: 8,
          }}
        >
          <Link
            href="/engine"
            style={{ color: "#dfe8ff", textDecoration: "none" }}
          >
            Engine control plane
          </Link>
          <Link
            href="/tasks"
            style={{ color: "#dfe8ff", textDecoration: "none" }}
          >
            My tasks
          </Link>
          <small style={{ color: "#b7c7ea" }}>
            Access is role-scoped and audited.
          </small>
        </div>
      </aside>

      <section style={{ padding: 32 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            marginBottom: 26,
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <p
              style={{
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: 11,
                fontWeight: 700,
                color: "#5d6e94",
              }}
            >
              {config.roles} workspace
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                color: "#5d6e94",
              }}
            >
              <Link
                href={`/${portal}`}
                style={{ color: "#4e6ef2", textDecoration: "none" }}
              >
                Home
              </Link>
              <span>/</span>
              <span>{config.label}</span>
            </div>
            <h1
              style={{
                margin: "10px 0 12px",
                fontSize: "clamp(2rem, 3vw, 3rem)",
                lineHeight: 1.1,
              }}
            >
              {config.title}
            </h1>
            <p
              style={{
                margin: 0,
                color: "#4c5d7a",
                fontSize: 18,
                lineHeight: 1.6,
              }}
            >
              {config.summary}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/engine"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #dfe8f5",
                textDecoration: "none",
                color: "#15233a",
                fontWeight: 700,
              }}
            >
              View workflow
            </Link>
            <Link
              href={portal === "admin" ? "/admin" : "/tasks"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                borderRadius: 12,
                background: "#4e6ef2",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open actions
            </Link>
            <NotificationBell />
          </div>
        </header>

        {error && (
          <div
            style={{
              marginBottom: 24,
              padding: "14px 16px",
              borderRadius: 12,
              background: "#fff7e7",
              color: "#8a5d00",
              border: "1px solid #f5d08a",
            }}
          >
            Secure data connection required. {error}{" "}
            {error.includes("Sign in") && (
              <Link
                href={`/login?next=${encodeURIComponent(`/${portal}`)}`}
                style={{ color: "#145742", fontWeight: 700 }}
              >
                Sign in →
              </Link>
            )}
          </div>
        )}

        <PortalExperience portal={portal} />

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e4ebf3",
            borderRadius: 22,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#607495",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {config.label} workflow
              </p>
              <h2 style={{ margin: "10px 0 0", fontSize: 28 }}>
                {config.workflowTitle}
              </h2>
            </div>
            <Link
              href="/workflows"
              style={{
                color: "#4e6ef2",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open flow →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            {config.stages.map((stage, index) => (
              <div
                key={stage}
                style={{
                  background: index < 3 ? "#eaf3ff" : "#f2f6fb",
                  border: `1px solid ${index < 3 ? "#b8d1ff" : "#dfe8f5"}`,
                  borderRadius: 14,
                  padding: "14px 12px",
                  color: "#1d2f50",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    background: index < 3 ? "#4e6ef2" : "#dfe8f5",
                    color: index < 3 ? "#fff" : "#364b6d",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ fontWeight: 700 }}>{stage}</div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 18,
          }}
        >
          {cards.map((card) => (
            <Link
              key={card.title}
              href="/tasks"
              style={{
                textDecoration: "none",
                background: "#fff",
                border: "1px solid #e3ebf7",
                borderRadius: 18,
                padding: 18,
                color: "#15233a",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  color: "#697d9d",
                  marginBottom: 8,
                }}
              >
                {card.hint}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>
                {card.value ?? "—"}
              </div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>{card.title}</div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
