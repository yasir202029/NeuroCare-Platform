"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";



type SafetyCheck = {
  medication: string;
  safe: boolean;
  warnings: string[];
  interactions: string[];
  contraindications: string[];
  recommendations: string[];
};

type Patient = {
  id: string;
  user: { firstName: string; lastName: string; email: string };
};

type SafetyAlert = {
  id: string;
  patientId: string;
  alertType: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
};

export default function MedicationSafetyPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [result, setResult] = useState<SafetyCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    patientId: string;
    medication: string;
    currentMedications: string[];
    conditions: string[];
    allergies: string[];
    age: string;
    pregnancyStatus: boolean;
  }>({
    patientId: "",
    medication: "",
    currentMedications: [],
    conditions: [],
    allergies: [],
    age: "",
    pregnancyStatus: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    authenticatedFetch("/api/v1/patients?take=50")
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setPatients((data as any).patients ?? (data as any) ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadAlerts(patientId: string) {
    const res = await authenticatedFetch(`/api/v1/clinical-risk/safety-alerts?patientId=${patientId}&acknowledged=false`);
    if (res.ok) {
      setAlerts(await res.json());
    }
  }

  async function checkSafety(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await authenticatedFetch("/api/v1/ai/medication-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          medication: form.medication,
          currentMedications: form.currentMedications.filter(Boolean),
          conditions: form.conditions.filter(Boolean),
          allergies: form.allergies.filter(Boolean),
          age: form.age ? Number(form.age) : undefined,
          pregnancyStatus: form.pregnancyStatus,
        }),
      });
      if (!res.ok) throw new Error("Safety check failed");
      const data = await res.json();
      setResult(data.safety);
      if (form.patientId) await loadAlerts(form.patientId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Medication safety check failed.");
    } finally {
      setBusy(false);
    }
  }

  async function acknowledgeAlert(id: string) {
    await authenticatedFetch(`/api/v1/clinical-risk/safety-alerts/${id}/acknowledge`, { method: "PATCH" });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "24px clamp(20px, 5vw, 64px) 56px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <Link href="/prescriber" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
            NEUROCARE
          </Link>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            Medication Safety · ADHD EHR
          </p>
        </div>
        <Link
          href="/prescriber"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            background: "#ffffff",
            color: "#1e293b",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          ← Back to Prescriber
        </Link>
      </header>

      <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 12px", letterSpacing: -0.02 }}>
        Medication Safety Check
      </h1>
      <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 800 }}>
        AI-powered medication safety validation for ADHD prescriptions. Checks for drug interactions,
        contraindications, allergies, and pregnancy safety. Generates safety alerts for critical findings.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
          Safety Assessment
        </h2>
        <form onSubmit={checkSafety} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Patient
            <select
              required
              value={form.patientId}
              onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.firstName} {p.user.lastName}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Proposed Medication
            <input
              required
              value={form.medication}
              onChange={(e) => setForm((prev) => ({ ...prev, medication: e.target.value }))}
              placeholder="e.g. Methylphenidate 18mg"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Current Medications (comma-separated)
            <input
              value={form.currentMedications.join(", ")}
              onChange={(e) => setForm((prev) => ({ ...prev, currentMedications: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
              placeholder="e.g. Atorvastatin, Omeprazole"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Conditions (comma-separated)
            <input
              value={form.conditions.join(", ")}
              onChange={(e) => setForm((prev) => ({ ...prev, conditions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
              placeholder="e.g. Hypertension, Anxiety"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Allergies (comma-separated)
            <input
              value={form.allergies.join(", ")}
              onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
              placeholder="e.g. Penicillin, Sulfa"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Age
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
              placeholder="Optional"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            <input
              type="checkbox"
              checked={form.pregnancyStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, pregnancyStatus: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "#4e6ef2" }}
            />
            Pregnancy / Breastfeeding
          </label>
          <button disabled={busy} style={{
            background: "#4e6ef2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontWeight: 800,
            cursor: "pointer",
            font: "inherit",
          }}>
            {busy ? "Checking…" : "Run Safety Check"}
          </button>
        </form>
      </section>

      {/* Safety result */}
      {result && (
        <section
          style={{
            background: result.safe ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${result.safe ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: result.safe ? "#16a34a" : "#b91c1c" }}>
                Medication Safety: {result.medication}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
                {result.safe ? "SAFE TO PRESCRIBE" : "SAFETY CONCERNS DETECTED"}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>
              AI-assisted check · Requires clinician review
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#ca8a04", marginBottom: 6 }}>
                Warnings
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 13 }}>
                {result.warnings.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
              </ul>
            </div>
          )}
          {result.interactions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#b91c1c", marginBottom: 6 }}>
                Drug Interactions
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 13 }}>
                {result.interactions.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
              </ul>
            </div>
          )}
          {result.contraindications.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#7f1d1d", marginBottom: 6 }}>
                Contraindications
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 13 }}>
                {result.contraindications.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
              </ul>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#4e6ef2", marginBottom: 6 }}>
              Recommendations
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#334155", fontSize: 13 }}>
              {result.recommendations.map((w, i) => <li key={i} style={{ marginBottom: 4 }}>{w}</li>)}
            </ul>
          </div>
        </section>
      )}

      {/* Safety alerts */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
          Active Safety Alerts
        </h2>
        {alerts.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>
            No active safety alerts. All clear.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  border: "1px solid #fef2f2",
                  borderRadius: 10,
                  background: alert.severity === "CRITICAL" ? "#fef2f2" : "#ffffff",
                  borderLeft: `4px solid ${alert.severity === "CRITICAL" ? "#b91c1c" : "#d97706"}`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: alert.severity === "CRITICAL" ? "#b91c1c" : "#d97706",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: "#1e293b" }}>
                    {alert.alertType.replace(/_/g, " ")}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    {alert.message}
                  </div>
                </div>
                <button
                  onClick={() => void acknowledgeAlert(alert.id)}
                  disabled={alert.acknowledged}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 6,
                    background: alert.acknowledged ? "#cbd5e1" : "#4e6ef2",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: alert.acknowledged ? "not-allowed" : "pointer",
                  }}
                >
                  {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
