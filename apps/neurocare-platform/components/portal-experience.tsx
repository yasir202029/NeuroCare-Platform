"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../lib/client-api";
import { ClinicalFormRenderer } from "./clinical-form-renderer";

type PatientProfile = {
  id: string;
  medicalHistory?: string | null;
  accessibilityNeeds?: string | null;
  user?: { firstName: string; lastName: string; email: string; phone?: string | null };
  nhsNumberHash?: string | null;
};
type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  status: string;
  clinicianId?: string | null;
  clinician?: { firstName: string; lastName: string } | null;
  videoSession?: { id: string; joinUrl?: string | null; startedAt?: string | null } | null;
};
type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  clinicianId: string;
};
type Thread = {
  id: string;
  subject?: string | null;
  messages: { id: string; body: string; createdAt: string; senderId?: string | null }[];
};
type Document = {
  id: string;
  type: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};
type RiskScore = {
  overallScore: number;
  riskBand: string;
  factors: Record<string, { score: number; label: string }>;
  reviewedAt: string;
};
type Medication = {
  id: string;
  medication: string;
  dose?: string | null;
  status: string;
  createdAt: string;
};

const portalColor: Record<string, string> = {
  patient: "#145742",
  clinician: "#1d4ed8",
  titration: "#7c3aed",
  prescriber: "#be185d",
  finance: "#b45309",
  admin: "#0f172a",
};

function PortalHeader({ portal }: { portal: string }) {
  const color = portalColor[portal] ?? "#0f172a";
  return (
    <header
      style={{
        background: color,
        color: "#ffffff",
        padding: "20px clamp(20px, 5vw, 64px) 20px",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255,255,255,0.2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            n
          </div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.02 }}>
            NEUROCARE
          </span>
        </div>
        <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: 13 }}>
          {portal.charAt(0).toUpperCase() + portal.slice(1)} workspace
        </p>
      </div>
    </header>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
  gap: 18,
  marginTop: 24,
};
const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
  display: "grid",
  alignContent: "start",
  gap: 16,
};
const fieldStyle = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  font: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
} as React.CSSProperties;
const labelStyle = {
  display: "grid",
  gap: 6,
  fontWeight: 700,
  fontSize: 13,
  color: "#334155",
};
const primaryButton = {
  background: "#4e6ef2",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontWeight: 800,
  cursor: "pointer",
  font: "inherit",
};
const secondaryButton = {
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
  font: "inherit",
};
const metricStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 18,
  display: "grid",
  gap: 8,
};
const noticeStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 12,
};

export function PortalExperience({ portal }: { portal: string }) {
  if (portal === "patient") return <PatientExperience />;
  if (portal === "clinician") return <ClinicianExperience />;
  if (portal === "titration") return <TitrationExperience />;
  if (portal === "prescriber") return <PrescriberExperience />;
  if (portal === "finance") return <FinanceExperience />;
  if (portal === "admin") return <AdminExperience />;
  return (
    <div style={{ padding: 40, color: "#64748b" }}>
      Portal "{portal}" not found.
    </div>
  );
}

function PatientExperience() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [slotId, setSlotId] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    setError("");
    try {
      const from = new Date();
      const to = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
      const [nextProfile, nextAppointments, nextThreads, nextSlots, nextDocs, nextRisk] =
        await Promise.all([
          authenticatedFetch("/api/v1/patients/me"),
          authenticatedFetch("/api/v1/booking/appointments"),
          authenticatedFetch("/api/v1/messages"),
          authenticatedFetch(
            `/api/v1/booking/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
          ),
          authenticatedFetch("/api/v1/patients/documents"),
          authenticatedFetch("/api/v1/patients/me/risk-score"),
        ]);
      const [profileJson, appointmentsJson, threadsJson, slotsJson, docsJson, riskJson] =
        await Promise.all([
          nextProfile.json(),
          nextAppointments.json(),
          nextThreads.json(),
          nextSlots.json(),
          nextDocs.json(),
          nextRisk.json(),
        ]);
      setProfile(profileJson as PatientProfile);
      setAppointments(appointmentsJson as Appointment[]);
      setThreads(threadsJson as Thread[]);
      setSlots(slotsJson as Slot[]);
      setDocuments(docsJson as Document[]);
      const risk = riskJson as { score?: RiskScore | null };
      setRiskScore(risk.score ?? null);
      setThreadId((current) => current || (threadsJson as Thread[])[0]?.id || "");
      setSlotId((current) => current || (slotsJson as Slot[])[0]?.id || "");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load your care workspace.",
      );
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await authenticatedFetch("/api/v1/patients/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicalHistory, accessibilityNeeds }),
      });
      if (!res.ok) throw new Error("Could not save profile");
      setNotice("Your care information was saved.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Could not save your information.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return setNotice("Choose an available appointment time first.");
    setBusy(true);
    try {
      const res = await authenticatedFetch("/api/v1/booking/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADHD",
          mode: slot.mode,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          clinicianId: slot.clinicianId,
          availabilityId: slot.id,
        }),
      });
      if (!res.ok) throw new Error("Could not book appointment");
      setNotice("Appointment booked successfully.");
      setSlotId("");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Could not book appointment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!threadId) return setNotice("No conversation thread available.");
    setBusy(true);
    try {
      const res = await authenticatedFetch("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, subject, body: message }),
      });
      if (!res.ok) throw new Error("Could not send message");
      setSubject("");
      setMessage("");
      setNotice("Message sent to your care team.");
      await reload();
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Could not send message.",
      );
    } finally {
      setBusy(false);
    }
  }

  const color = portalColor.patient;
  const riskColor =
    riskScore?.riskBand === "CRITICAL"
      ? "#b91c1c"
      : riskScore?.riskBand === "HIGH"
        ? "#d97706"
        : riskScore?.riskBand === "MODERATE"
          ? "#ca8a04"
          : "#16a34a";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <PortalHeader portal="patient" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        {error && (
          <div
            style={{
              ...noticeStyle,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}
          >
            {notice}
          </div>
        )}

        {/* Risk score banner */}
        {riskScore && (
          <section
            style={{
              background: "#ffffff",
              border: `1px solid ${riskColor}33`,
              borderRadius: 14,
              padding: 20,
              marginBottom: 24,
              borderLeft: `4px solid ${riskColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div style={{ color: riskColor, fontSize: 11, textTransform: "uppercase", fontWeight: 900, letterSpacing: 1 }}>
                Clinical Risk Assessment
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#0f172a" }}>
                {riskScore.overallScore}
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
                Risk band: {riskScore.riskBand} · Last reviewed{" "}
                {new Date(riskScore.reviewedAt).toLocaleDateString("en-GB")}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>
              NICE-aligned ADHD stratification
            </div>
          </section>
        )}

        {/* Metrics */}
        <section style={gridStyle}>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>
              Upcoming appointments
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>
              {appointments.filter((a) => a.status !== "COMPLETED").length}
            </div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>
              Messages
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>
              {threads.length}
            </div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>
              Documents
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>
              {documents.length}
            </div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>
              Care plan status
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#16a34a" }}>
              Active
            </div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Profile */}
          <section style={panelStyle}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 10 }}>
              Your profile
            </div>
            <form onSubmit={saveProfile} style={{ display: "grid", gap: 14 }}>
              <label style={labelStyle}>
                Medical history
                <textarea
                  required
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={3}
                  style={fieldStyle}
                />
              </label>
              <label style={labelStyle}>
                Accessibility needs
                <textarea
                  required
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  rows={2}
                  style={fieldStyle}
                />
              </label>
              <button disabled={busy} style={primaryButton}>
                {busy ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>

          {/* Book appointment */}
          <section style={panelStyle}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 10 }}>
              Book ADHD assessment
            </div>
            <form onSubmit={requestAppointment} style={{ display: "grid", gap: 14 }}>
              <label style={labelStyle}>
                Available slot
                <select
                  required
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  style={fieldStyle}
                >
                  <option value="">Select a time</option>
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {new Date(slot.startsAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} ({slot.mode})
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={busy || !slotId} style={primaryButton}>
                {busy ? "Booking…" : "Book appointment"}
              </button>
            </form>
          </section>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Messages */}
          <section style={panelStyle}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 10 }}>
              Messages with care team
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, background: "#f8fafc", marginBottom: 12 }}>
              {threads.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: 20 }}>No messages yet.</p>
              ) : (
                threads.map((thread) => (
                  <div key={thread.id} style={{ padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>
                      {thread.subject || "Care team message"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      {thread.messages.slice(-1)[0]?.body ?? ""}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} style={{ display: "grid", gap: 10 }}>
              <label style={labelStyle}>
                Subject
                <input required value={subject} onChange={(e) => setSubject(e.target.value)} style={fieldStyle} />
              </label>
              <label style={labelStyle}>
                Message
                <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={2} style={fieldStyle} />
              </label>
              <button disabled={busy || !threadId} style={primaryButton}>Send message</button>
            </form>
          </section>

          {/* Documents */}
          <section style={panelStyle}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 10 }}>
              Your documents
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {documents.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: 20 }}>No documents uploaded.</p>
              ) : (
                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                  {documents.map((doc) => (
                    <li key={doc.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{doc.name}</div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>{doc.type} · {doc.mimeType}</div>
                      </div>
                      <div style={{ color: "#64748b", fontSize: 11 }}>{new Date(doc.createdAt).toLocaleDateString("en-GB")}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </section>

        {notice && (
          <div style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}>
            {notice}
          </div>
        )}
      </div>
    </main>
  );
}

function ClinicianExperience() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [riskRankings, setRiskRankings] = useState<any[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [transitionBusy, setTransitionBusy] = useState<string | null>(null);

  type WorkflowStage = "REFERRAL" | "ADMIN_TRIAGE" | "ASSESSMENT" | "DIAGNOSIS" | "MORE_INFORMATION_REQUIRED" | "ECG_REQUESTED" | "ASSESSMENT_REVIEW" | "TITRATION" | "PRESCRIBING" | "SHARED_CARE" | "DISCHARGE";

  async function reload() {
    setError("");
    try {
      const [wsRes, rankingsRes, alertsRes] = await Promise.all([
        authenticatedFetch("/api/v1/clinician/workspace"),
        authenticatedFetch("/api/v1/clinical-risk/rankings?portal=clinician"),
        authenticatedFetch("/api/v1/clinical-risk/safety-alerts?acknowledged=false"),
      ]);
      setWorkspace(await wsRes.json());
      setRiskRankings(await rankingsRes.json());
      setSafetyAlerts(await alertsRes.json());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load the clinical workspace.",
      );
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const color = portalColor.clinician;
  const patients = workspace?.patients ?? [];
  const highRisk = patients.filter((p: any) => p.assessments?.some((a: any) => a.adhd?.titrationPlans?.some((t: any) => t.status === "ACTIVE")));

  const stageLabel: Record<string, string> = {
    REFERRAL: "Referral",
    ADMIN_TRIAGE: "Admin Triage",
    ASSESSMENT: "Assessment",
    DIAGNOSIS: "Diagnosis",
    MORE_INFORMATION_REQUIRED: "More Information Required",
    ECG_REQUESTED: "ECG Requested",
    ASSESSMENT_REVIEW: "Assessment Review",
    TITRATION: "Titration",
    PRESCRIBING: "Prescribing",
    SHARED_CARE: "Shared Care",
    DISCHARGE: "Discharge",
  };

  const transitionsFrom: Record<string, string[]> = {
    REFERRAL: ["ASSESSMENT"],
    ADMIN_TRIAGE: ["ASSESSMENT", "MORE_INFORMATION_REQUIRED"],
    ASSESSMENT: ["OUTCOME", "MORE_INFORMATION_REQUIRED", "ECG_REQUESTED"],
    ASSESSMENT_REVIEW: ["OUTCOME", "MORE_INFORMATION_REQUIRED", "ECG_REQUESTED"],
    OUTCOME: ["TITRATION", "PRESCRIBING", "SHARED_CARE", "DISCHARGE"],
    ECG_REQUESTED: ["ASSESSMENT_REVIEW"],
    TITRATION: ["PRESCRIBING", "SHARED_CARE", "DISCHARGE"],
    PRESCRIBING: ["SHARED_CARE", "DISCHARGE"],
    SHARED_CARE: ["DISCHARGE"],
    DISCHARGE: [],
  };

  async function runTransition(patientId: string, toStage: WorkflowStage, reason: string) {
    setTransitionBusy(patientId);
    try {
      const res = await authenticatedFetch("/api/v1/engine/workflows/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, toStage, reason }),
      });
      if (!res.ok) throw new Error("Transition failed");
      await res.json();
      setNotice(`Advanced patient to ${toStage.replace(/_/g, " ")}`);
      await reload();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Transition failed.");
    } finally {
      setTransitionBusy(null);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PortalHeader portal="clinician" />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {error && <div style={{ ...noticeStyle, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>{error}</div>}
        {notice && <div style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}>{notice}</div>}

        <section style={gridStyle}>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Total patients</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{workspace?.totalPatients ?? 0}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Risk-ranked</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#b91c1c" }}>{riskRankings.length}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Safety alerts</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#d97706" }}>{safetyAlerts.length}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Today's sessions</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{patients.filter((p: any) => p.appointments?.length).length}</div>
          </div>
        </section>

        {/* Safety alerts */}
        <section style={{ ...panelStyle, marginBottom: 24 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            ⚠ Clinical safety alerts
          </div>
          {safetyAlerts.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No active safety alerts.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {safetyAlerts.map((alert: any) => (
                <div key={alert.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "1px solid #fef2f2", borderRadius: 10, background: "#fef2f2", borderLeft: `4px solid ${alert.severity === "CRITICAL" ? "#b91c1c" : "#d97706"}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#b91c1c" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "#1e293b" }}>{alert.patient?.user?.firstName} {alert.patient?.user?.lastName}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{alert.message}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: alert.severity === "CRITICAL" ? "#b91c1c" : "#d97706" }}>
                    {alert.alertType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Risk-ranked worklist with workflow branches */}
        <section style={panelStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            Prioritised patient worklist (NICE-aligned risk ranking)
          </div>
          {riskRankings.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              <p>No ranked patients yet.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Complete assessments in the UK ADHD clinic to generate risk rankings.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px" }}>Rank</th>
                    <th style={{ padding: "12px 16px" }}>Patient</th>
                    <th style={{ padding: "12px 16px" }}>Risk score</th>
                    <th style={{ padding: "12px 16px" }}>Band</th>
                    <th style={{ padding: "12px 16px" }}>Current stage</th>
                    <th style={{ padding: "12px 16px" }}>Workflow actions</th>
                  </tr>
                </thead>
                <tbody>
                  {riskRankings.map((rank: any) => {
                    const patient = rank.patient;
                    const currentStage = patient?.currentStage || "REFERRAL";
                    const available = transitionsFrom[currentStage as keyof typeof transitionsFrom] || [];
                    return (
                      <tr key={rank.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 900, color: color }}>#{rank.rankPosition}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>{patient?.user?.firstName} {patient?.user?.lastName}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: "#d97706" }}>{rank.score}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 4, background: "#fef2f2", color: "#b91c1c", fontSize: 11, fontWeight: 800 }}>
                            {rank.riskBand || "LOW"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#334155", fontWeight: 600 }}>
                          {stageLabel[currentStage] || currentStage}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {available.length === 0 ? (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Complete</span>
                          ) : (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {available.map((t) => (
                                <button
                                  key={t}
                                  onClick={() => runTransition(patient.id, t as WorkflowStage, `Clinician-initiated transition to ${t}`)}
                                  disabled={transitionBusy === patient.id}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    border: `1px solid ${color}`,
                                    background: "#ffffff",
                                    color: color,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    cursor: transitionBusy === patient.id ? "not-allowed" : "pointer",
                                  }}
                                >
                                  {t.replace(/_/g, " ")}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Patient cards */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {patients.slice(0, 6).map((patient: any) => (
            <div key={patient.id} style={panelStyle}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b" }}>
                Patient record
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>
                {patient.user?.firstName} {patient.user?.lastName}
              </div>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>{patient.appointments?.[0]?.startsAt ? new Date(patient.appointments[0].startsAt).toLocaleDateString("en-GB") : "No upcoming appointment"}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button style={{ ...primaryButton, fontSize: 12, padding: "6px 12px", flex: 1 }}>View record</button>
                <button style={{ ...secondaryButton, fontSize: 12, padding: "6px 12px", flex: 1 }}>Messages</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function TitrationExperience() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [assessmentId, setAssessmentId] = useState("");
  const [medication, setMedication] = useState("");
  const [dose, setDose] = useState("");
  const [response, setResponse] = useState("");
  const [sideEffects, setSideEffects] = useState("");

  async function reload() {
    setError("");
    try {
      const wsRes = await authenticatedFetch("/api/v1/clinician/workspace");
      setWorkspace(await wsRes.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load titration cases.");
    }
  }

  useEffect(() => { void reload(); }, []);

  const color = portalColor.titration;
  const cases =
    workspace?.patients.flatMap((patient: any) =>
      patient.assessments
        .filter((a: any) => a.type === "ADHD")
        .map((assessment: any) => ({ patient, assessment })),
    ) ?? [];

  async function saveReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await authenticatedFetch(`/api/v1/adhd/assessments/${assessmentId}/medication-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication, dose, response, sideEffects }),
      });
      if (!res.ok) throw new Error("Could not save review");
      setMedication(""); setDose(""); setResponse(""); setSideEffects("");
      setNotice("Medication review recorded.");
      await reload();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not save medication review.");
    } finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PortalHeader portal="titration" />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {error && <div style={{ ...noticeStyle, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>{error}</div>}
        {notice && <div style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}>{notice}</div>}

        <section style={panelStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            Active titration cases
          </div>
          {cases.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No active titration cases.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {cases.map(({ patient, assessment }: any) => (
                <div key={assessment.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#fff" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>{patient.user.firstName} {patient.user.lastName}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>
                    {assessment.adhd?.titrationPlans?.map((p: any) => `${p.status} · ${p.targetMedication ?? "medication"}`).join(" · ") || "No plan"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            Record medication review
          </div>
          <form onSubmit={saveReview} style={{ display: "grid", gap: 12 }}>
            <label style={labelStyle}>Assessment
              <select required value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} style={fieldStyle}>
                <option value="">Select assessment</option>
                {cases.map(({ patient, assessment }: any) => (
                  <option key={assessment.id} value={assessment.id}>{patient.user.firstName} {patient.user.lastName}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>Medication
              <input required value={medication} onChange={(e) => setMedication(e.target.value)} style={fieldStyle} />
            </label>
            <label style={labelStyle}>Dose
              <input value={dose} onChange={(e) => setDose(e.target.value)} style={fieldStyle} />
            </label>
            <label style={labelStyle}>Response
              <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={2} style={fieldStyle} />
            </label>
            <label style={labelStyle}>Side effects
              <textarea value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} rows={2} style={fieldStyle} />
            </label>
            <button disabled={busy || !assessmentId} style={primaryButton}>{busy ? "Saving…" : "Save medication review"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function PrescriberExperience() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  async function reload() {
    setError("");
    try {
      const wsRes = await authenticatedFetch("/api/v1/clinician/workspace");
      setWorkspace(await wsRes.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load prescriptions.");
    }
  }

  useEffect(() => { void reload(); }, []);

  const color = portalColor.prescriber;
  const prescriptions =
    workspace?.patients.flatMap((patient: any) =>
      patient.prescriptions.map((prescription: any) => ({ patient, prescription })),
    ) ?? [];

  async function sign(prescriptionId: string) {
    setBusyId(prescriptionId);
    try {
      const res = await authenticatedFetch(`/api/v1/clinician/prescriptions/${prescriptionId}/sign`, { method: "POST" });
      if (!res.ok) throw new Error("Could not sign");
      setNotice("Prescription signed and audit history updated.");
      await reload();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not sign prescription.");
    } finally { setBusyId(""); }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PortalHeader portal="prescriber" />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {error && <div style={{ ...noticeStyle, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>{error}</div>}
        {notice && <div style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}>{notice}</div>}

        <section style={panelStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            Prescription review queue
          </div>
          {prescriptions.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No prescriptions awaiting review.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {prescriptions.map(({ patient, prescription }: any) => (
                <div key={prescription.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{patient.user.firstName} {patient.user.lastName}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{prescription.items.map((i: any) => i.medication).join(", ") || "Medication details pending"}</div>
                    <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 800, color: prescription.status === "PENDING_SIGNATURE" ? "#d97706" : "#16a34a" }}>
                      {prescription.status.replace(/_/g, " ")}
                    </div>
                  </div>
                  {prescription.status === "PENDING_SIGNATURE" ? (
                    <button disabled={busyId === prescription.id} onClick={() => void sign(prescription.id)} style={{ ...primaryButton, fontSize: 12, padding: "8px 14px" }}>
                      {busyId === prescription.id ? "Signing…" : "Sign prescription"}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FinanceExperience() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function reload() {
    setError("");
    try {
      const [dRes, iRes] = await Promise.all([
        authenticatedFetch("/api/v1/finance/dashboard"),
        authenticatedFetch("/api/v1/billing/invoices"),
      ]);
      setDashboard(await dRes.json());
      setInvoices(await iRes.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load finance workspace.");
    }
  }

  useEffect(() => { void reload(); }, []);

  const color = portalColor.finance;
  const pounds = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value / 100);

  async function checkout(invoiceId: string) {
    try {
      const result = await authenticatedFetch(`/api/v1/billing/invoices/${invoiceId}/checkout`, { method: "POST" });
      const url = (result as any).url ?? (result as any).session?.url;
      if (url) window.location.assign(url);
      else setNotice("Checkout created but no payment URL returned.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Could not start invoice payment.");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PortalHeader portal="finance" />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {error && <div style={{ ...noticeStyle, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>{error}</div>}
        {notice && <div style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}>{notice}</div>}

        <section style={gridStyle}>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>New patients</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{dashboard?.patients?.new ?? "—"}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Active patients</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{dashboard?.patients?.active ?? "—"}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Outstanding balance</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{dashboard ? pounds(dashboard.outstandingBalancePence) : "—"}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>ADHD assessments</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{dashboard?.activity?.adhdAssessments ?? "—"}</div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            Invoices and payments
          </div>
          {invoices.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No invoices available.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {invoices.map((invoice: any) => (
                <div key={invoice.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{pounds(invoice.totalPence)}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{invoice.status.replace(/_/g, " ")} · {new Date(invoice.createdAt).toLocaleDateString("en-GB")}</div>
                  </div>
                  {["OPEN", "OVERDUE"].includes(invoice.status) ? (
                    <button onClick={() => void checkout(invoice.id)} style={{ ...primaryButton, fontSize: 12, padding: "8px 14px" }}>Pay invoice</button>
                  ) : (
                    <span style={{ fontSize: 11, color: "#64748b" }}>{invoice.status.replace(/_/g, " ")}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminExperience() {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [riskRankings, setRiskRankings] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);

  async function reload() {
    setError("");
    try {
      const [uRes, rRes, fRes] = await Promise.all([
        authenticatedFetch("/api/v1/admin/users"),
        authenticatedFetch("/api/v1/clinical-risk/rankings?portal=clinician"),
        authenticatedFetch("/api/v1/clinical-forms"),
      ]);
      setUsers(await uRes.json());
      setRiskRankings(await rRes.json());
      setForms(await fRes.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load admin data.");
    }
  }

  useEffect(() => { void reload(); }, []);

  const color = portalColor.admin;

  return (
    <main style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a", fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PortalHeader portal="admin" />
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {error && <div style={{ ...noticeStyle, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>{error}</div>}
        {notice && <div style={{ ...noticeStyle, background: "#ecfdf5", border: "1px solid #bbf7d0", color: "#14532b" }}>{notice}</div>}

        <section style={gridStyle}>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Users</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{users.length}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Clinical forms</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{forms.length}</div>
          </div>
          <div style={metricStyle}>
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Risk-ranked patients</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: color }}>{riskRankings.length}</div>
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <section style={panelStyle}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
              User management
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px" }}>Name</th>
                    <th style={{ padding: "12px 16px" }}>Email</th>
                    <th style={{ padding: "12px 16px" }}>Roles</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No users found.</td></tr>
                  ) : (
                    users.map((u: any) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>{u.firstName} {u.lastName}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{u.email}</td>
                        <td style={{ padding: "12px 16px", fontSize: 11 }}>{(u.roles ?? []).join(", ")}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#16a34a" }}>{u.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section style={panelStyle}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
              Clinical forms library
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px" }}>Template</th>
                    <th style={{ padding: "12px 16px" }}>Category</th>
                    <th style={{ padding: "12px 16px" }}>Instrument</th>
                    <th style={{ padding: "12px 16px" }}>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No forms defined yet. Create templates in the UK ADHD clinic.</td></tr>
                  ) : (
                    forms.map((f: any) => (
                      <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>{f.name}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{f.category}</td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{f.instrument ?? "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>{f._count?.submissions ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section style={panelStyle}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#64748b", marginBottom: 12 }}>
            Risk-ranked patient worklist
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: 11, borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Rank</th>
                  <th style={{ padding: "12px 16px" }}>Patient</th>
                  <th style={{ padding: "12px 16px" }}>Score</th>
                  <th style={{ padding: "12px 16px" }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {riskRankings.slice(0, 10).map((rank: any) => (
                  <tr key={rank.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 900, color: color }}>#{rank.rankPosition}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{rank.patient?.user?.firstName} {rank.patient?.user?.lastName}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#d97706" }}>{rank.score}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{rank.reason ?? "Risk-based prioritisation"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
