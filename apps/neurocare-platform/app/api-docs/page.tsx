import Link from "next/link";

export const metadata = {
  title: "API Documentation — NeuroCare Platform",
  description:
    "NeuroCare Platform API reference for authentication, patients, bookings, ADHD assessments, engine, reports, GP communication, hooks, rails, and coordination.",
  openGraph: {
    title: "API Documentation — NeuroCare Platform",
    description:
      "NeuroCare Platform API reference for clinical operations.",
    type: "website",
  },
};

const endpoints = [
  {
    group: "Authentication",
    items: [
      { method: "POST", path: "/api/v1/auth/login", desc: "Authenticate and set HttpOnly cookies" },
      { method: "POST", path: "/api/v1/auth/logout", desc: "Clear session cookies" },
      { method: "POST", path: "/api/v1/auth/refresh", desc: "Refresh access token" },
    ],
  },
  {
    group: "Patients",
    items: [
      { method: "GET", path: "/api/v1/patients/me", desc: "Get current patient profile" },
      { method: "PATCH", path: "/api/v1/patients/profile", desc: "Update progressive onboarding profile" },
      { method: "GET", path: "/api/v1/patients/me/risk-score", desc: "Get latest clinical risk score" },
      { method: "GET", path: "/api/v1/patients/documents", desc: "List patient documents" },
      { method: "POST", path: "/api/v1/patients/documents", desc: "Upload a document" },
    ],
  },
  {
    group: "Booking",
    items: [
      { method: "GET", path: "/api/v1/booking/appointments", desc: "List appointments" },
      { method: "POST", path: "/api/v1/booking/appointments", desc: "Create an appointment" },
      { method: "GET", path: "/api/v1/booking/availability", desc: "Get available slots" },
    ],
  },
  {
    group: "Engine (mounted at /api/v1/engine)",
    items: [
      { method: "GET", path: "/api/v1/engine", desc: "Engine snapshot (states, rules, counts)" },
      { method: "GET", path: "/api/v1/engine/states", desc: "List workflow stages" },
      { method: "GET", path: "/api/v1/engine/rules", desc: "List transition rules" },
      { method: "GET", path: "/api/v1/engine/tasks", desc: "List clinical task queue items" },
      { method: "POST", path: "/api/v1/engine/workflows/transition", desc: "Rule-validated workflow transition" },
      { method: "POST", path: "/api/v1/engine/tasks/:id/complete", desc: "Complete a task queue item" },
    ],
  },
  {
    group: "Clinical Forms",
    items: [
      { method: "GET", path: "/api/v1/clinical-forms", desc: "List active form definitions" },
      { method: "POST", path: "/api/v1/clinical-forms", desc: "Create a form definition (staff)" },
      { method: "POST", path: "/api/v1/clinical-forms/submissions", desc: "Submit a form response" },
      { method: "GET", path: "/api/v1/clinical-forms/submissions", desc: "List submissions" },
    ],
  },
  {
    group: "Clinical Risk",
    items: [
      { method: "GET", path: "/api/v1/clinical-risk/risk-scores", desc: "List risk scores" },
      { method: "POST", path: "/api/v1/clinical-risk/risk-scores", desc: "Calculate and record risk score" },
      { method: "POST", path: "/api/v1/clinical-risk/rankings/recompute", desc: "Recompute patient ranking (admin)" },
      { method: "GET", path: "/api/v1/clinical-risk/rankings", desc: "List patient rankings" },
      { method: "GET", path: "/api/v1/clinical-risk/safety-alerts", desc: "List active safety alerts" },
      { method: "PATCH", path: "/api/v1/clinical-risk/safety-alerts/:id/acknowledge", desc: "Acknowledge an alert" },
    ],
  },
  {
    group: "GP Communication",
    items: [
      { method: "POST", path: "/api/v1/gp-communication/send", desc: "Send assessment/medication to GP" },
      { method: "GET", path: "/api/v1/gp-communication/patients/:id/communications", desc: "List GP communications" },
      { method: "POST", path: "/api/v1/gp-communication/record-updates", desc: "GP submits record update" },
      { method: "GET", path: "/api/v1/gp-communication/record-updates/pending", desc: "List pending record updates" },
      { method: "POST", path: "/api/v1/gp-communication/record-updates/:id/apply", desc: "Clinician applies update" },
      { method: "GET", path: "/api/v1/gp-communication/patients/:id/shared-care-summary", desc: "Shared care summary" },
    ],
  },
  {
    group: "Hooks & Rails",
    items: [
      { method: "GET", path: "/api/v1/hooks", desc: "List webhook hooks" },
      { method: "POST", path: "/api/v1/hooks", desc: "Create a hook (admin)" },
      { method: "POST", path: "/api/v1/hooks/:id/execute", desc: "Execute a hook manually" },
      { method: "GET", path: "/api/v1/hooks/executions", desc: "List hook executions" },
      { method: "GET", path: "/api/v1/rails", desc: "List guardrail rules" },
      { method: "POST", path: "/api/v1/rails", desc: "Create a rail rule (admin)" },
      { method: "POST", path: "/api/v1/rails/evaluate", desc: "Evaluate rails for an event" },
      { method: "GET", path: "/api/v1/rails/violations", desc: "List rail violations" },
    ],
  },
  {
    group: "Coordination",
    items: [
      { method: "GET", path: "/api/v1/coordination/summary", desc: "System health summary (all modules)" },
      { method: "GET", path: "/api/v1/coordination/modules/health", desc: "List module health statuses" },
      { method: "POST", path: "/api/v1/coordination/modules/health", desc: "Register module health (admin)" },
      { method: "POST", path: "/api/v1/coordination/events/emit", desc: "Emit cross-module event" },
    ],
  },
  {
    group: "Onboarding & SaaS",
    items: [
      { method: "GET", path: "/api/v1/onboarding/state", desc: "Get patient onboarding state" },
      { method: "PATCH", path: "/api/v1/onboarding/profile", desc: "Update onboarding profile" },
      { method: "POST", path: "/api/v1/onboarding/complete", desc: "Complete onboarding" },
      { method: "GET", path: "/api/v1/saas/plans", desc: "List subscription plans" },
      { method: "GET", path: "/api/v1/saas/feature-flags", desc: "List feature flags" },
    ],
  },
];

export default function ApiDocsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f6f8",
        color: "#15233a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "28px clamp(20px, 5vw, 64px) 56px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: 48 }}>
          <Link href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#145742" }}>
            NEUROCARE
          </Link>
          <Link href="/login" style={{ marginLeft: "auto", color: "#145742", border: "1px solid #cbd9d2", background: "#fff", padding: "8px 16px", borderRadius: 6, fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </header>

        <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px" }}>
          API Reference
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>
          Base URL: <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}</code><br />
          All API routes require authentication via HttpOnly cookies
          (<code>neurocare_access</code>), except where noted.
        </p>

        {endpoints.map((group) => (
          <section key={group.group} style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                margin: "0 0 16px",
                color: "#145742",
                paddingBottom: 8,
                borderBottom: "2px solid #e2e8f0",
              }}
            >
              {group.group}
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Method</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Endpoint</th>
                    <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => (
                    <tr
                      key={item.path}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: "#16a34a" }}>
                        {item.method}
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: "#15233a" }}>
                        {item.path}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#4b5563", fontSize: 13 }}>
                        {item.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
