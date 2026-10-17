"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";

type CommandCenter = {
  metrics: {
    patients: number;
    appointments: number;
    assessments: number;
    openTasks: number;
    openComplaints: number;
    auditAlerts: number;
  };
  taskQueues: { type: string; count: number }[];
  workflow: { stage: string; count: number }[];
};

const areas = [
  "Patients",
  "Clinical operations",
  "Care teams",
  "Appointments",
  "Assessments",
  "Titrations",
  "Prescriptions",
  "Reports",
  "Shared care",
  "Complaints",
  "Finance",
  "AI control",
  "Audit",
  "Permissions",
];
const workflows = [
  "Referral",
  "Booking",
  "Assessment",
  "Titration",
  "Prescribing",
  "Follow-up",
  "Shared care",
  "Discharge",
];
export default function AdminCommandCenter() {
  const [data, setData] = useState<CommandCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    authenticatedFetch("/api/v1/admin/command-center", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Sign in with an administrator account to load live operations."
              : "Operations data is unavailable.",
          );
        }
        return response.json() as Promise<CommandCenter>;
      })
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((reason: unknown) => {
        if ((reason as Error).name !== "AbortError") {
          setData(null);
          setError(
            reason instanceof Error
              ? reason.message
              : "Operations data is unavailable.",
          );
        }
      });

    return () => controller.abort();
  }, []);

  const metricCards = [
    ["Patients", data?.metrics.patients, "Open patient directory"],
    ["Appointments", data?.metrics.appointments, "Manage scheduling"],
    ["Active assessments", data?.metrics.assessments, "Open assessment board"],
    ["Open tasks", data?.metrics.openTasks, "Run task queue"],
    ["Complaints", data?.metrics.openComplaints, "Open case management"],
    ["Audit alerts", data?.metrics.auditAlerts, "Review audit events"],
  ];

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: collapsed ? "86px 1fr" : "220px 1fr",
        minHeight: "100vh",
        background: "#f3f6f8",
        color: "#15233a",
        transition: "all 0.2s ease",
      }}
    >
      <aside
        style={{
          background: "#12213f",
          color: "#eff5ff",
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <button
          onClick={() => setCollapsed((value) => !value)}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 20,
            fontWeight: 800,
            cursor: "pointer",
            textAlign: "left",
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
              fontSize: 16,
            }}
          >
            n
          </span>
          {!collapsed && <b>NeuroCare</b>}
        </button>

        {!collapsed && (
          <>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              Operations command
            </p>
            <nav style={{ display: "grid", gap: 8 }}>
              {areas.map((area) => (
                <a
                  key={area}
                  href={`#${area.toLowerCase().replace(/ /g, "-")}`}
                  style={{ color: "#dfe8ff", textDecoration: "none" }}
                >
                  {area}
                </a>
              ))}
            </nav>
            <div
              style={{
                marginTop: "auto",
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                color: "#dfe8ff",
              }}
            >
              Administrator workspace
              <br />
              <small>Role-scoped · audited</small>
            </div>
          </>
        )}
      </aside>

      <section style={{ padding: 28 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 18,
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5d6e94",
                fontWeight: 700,
              }}
            >
              NeuroCare Platform / Administration
            </p>
            <h1
              style={{
                margin: "12px 0 8px",
                fontSize: "clamp(2rem, 3vw, 2.8rem)",
              }}
            >
              Operations Command Centre
            </h1>
            <p
              style={{
                margin: 0,
                color: "#4c5d7a",
                fontSize: 18,
                lineHeight: 1.6,
              }}
            >
              Live patient operations, clinical workflow control, financial
              governance and auditable administration.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.assign("#patients")}
              style={{
                background: "#fff",
                border: "1px solid #dfe8f5",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Find patient
            </button>
            <button
              onClick={() => window.location.assign("#clinical-operations")}
              style={{
                background: "#4e6ef2",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create operational task
            </button>
          </div>
        </header>

        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff8dd",
              border: "1px solid #f4d38c",
              color: "#7b5a00",
            }}
          >
            <strong>Secure data connection required.</strong> {error}{" "}
            {error.includes("Sign in") && (
              <Link
                href="/login?next=%2Fadmin"
                style={{ color: "#145742", fontWeight: 700 }}
              >
                Sign in →
              </Link>
            )}
          </div>
        )}
        {!data && !error && (
          <p role="status">Loading authorised operations data…</p>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 18,
            marginBottom: 24,
          }}
        >
          {metricCards.map(([label, value, action]) => (
            <button
              key={String(label)}
              onClick={() =>
                window.location.assign(
                  `#${label === "Patients" ? "patients" : "clinical-operations"}`,
                )
              }
              style={{
                background: "#fff",
                border: "1px solid #e3ebf7",
                borderRadius: 18,
                padding: "18px 16px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <small
                style={{
                  color: "#6a7f9d",
                  textTransform: "uppercase",
                  letterSpacing: 1.3,
                }}
              >
                {label}
              </small>
              <strong
                style={{ display: "block", fontSize: 34, margin: "12px 0" }}
              >
                {value ?? "—"}
              </strong>
              <span style={{ color: "#4e6ef2", fontWeight: 700 }}>
                {action} →
              </span>
            </button>
          ))}
        </section>

        <section
          id="clinical-operations"
          style={{
            background: "#fff",
            border: "1px solid #e2ebf5",
            borderRadius: 20,
            padding: 18,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
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
                Workflow engine
              </p>
              <h2 style={{ margin: "10px 0 0", fontSize: 28 }}>
                Care pathway board
              </h2>
            </div>
            <button
              style={{
                background: "#edf3ff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Transfer patient
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            {workflows.map((stage) => (
              <article
                key={stage}
                style={{
                  background: "#f6f9ff",
                  border: "1px solid #dfe8f5",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <h3 style={{ margin: "0 0 8px" }}>{stage}</h3>
                <strong style={{ display: "block", fontSize: 28 }}>
                  {data?.workflow.find(
                    (item) =>
                      item.stage === stage.toUpperCase().replace(/-/g, "_"),
                  )?.count ?? "—"}
                </strong>
                <p style={{ margin: "6px 0 0", color: "#5f759c" }}>
                  Open cases
                </p>
                <button
                  style={{
                    marginTop: 12,
                    background: "transparent",
                    border: "none",
                    color: "#4e6ef2",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Open {stage.toLowerCase()} queue →
                </button>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 20,
          }}
        >
          <article
            id="patients"
            style={{
              background: "#fff",
              border: "1px solid #e2ebf5",
              borderRadius: 20,
              padding: 18,
            }}
          >
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
              Patient management
            </p>
            <h2 style={{ margin: "10px 0 8px", fontSize: 28 }}>
              Patient record workbench
            </h2>
            <p style={{ margin: 0, color: "#405477", lineHeight: 1.6 }}>
              Live care history, transfer status, risk flags and care
              coordination are tracked centrally with audit-ready actions.
            </p>
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                style={{
                  background: "#4e6ef2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open patient
              </button>
              <button
                style={{
                  background: "#edf3ff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Escalate case
              </button>
            </div>
          </article>

          <article
            style={{
              background: "#fff",
              border: "1px solid #e2ebf5",
              borderRadius: 20,
              padding: 18,
            }}
          >
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
              Queue health
            </p>
            <h2 style={{ margin: "10px 0 8px", fontSize: 28 }}>
              Operational pressure
            </h2>
            <ul
              style={{
                margin: "10px 0 0",
                paddingLeft: 18,
                color: "#405477",
                lineHeight: 2,
              }}
            >
              <li>5 urgent referrals awaiting triage</li>
              <li>2 shared care letters due this week</li>
              <li>3 pending financial exceptions</li>
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
