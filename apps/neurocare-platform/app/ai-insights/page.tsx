"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";



type AiInsight = {
  id: string;
  patientId: string;
  type: string;
  title: string;
  content: string;
  confidence: number;
  severity: string;
  dismissed: boolean;
  createdAt: string;
};

type Patient = {
  id: string;
  user: { firstName: string; lastName: string; email: string };
};

const severityColor: Record<string, string> = {
  CRITICAL: "#b91c1c",
  HIGH: "#d97706",
  MODERATE: "#ca8a04",
  LOW: "#16a34a",
  INFO: "#4e6ef2",
  WARNING: "#d97706",
};

export default function AiInsightsPage() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInsight, setNewInsight] = useState<{
    patientId: string;
    transcript: string;
    clinicalNotes: string;
    assessmentData: string;
  }>({ patientId: "", transcript: "", clinicalNotes: "", assessmentData: "{}" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/v1/patients?take=50"),
      authenticatedFetch("/api/v1/ai/insights?patientId=dummy"), // will 404, catch below
    ])
      .then(async ([pRes]) => {
        if (!active) return;
        if (pRes.ok) {
          const data = await pRes.json();
          setPatients((data as any).patients ?? (data as any) ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadInsights(patientId: string) {
    setLoading(true);
    try {
      const res = await authenticatedFetch(
        `/api/v1/ai/insights/${patientId}`,
      );
      if (res.ok) {
        setInsights(await res.json());
      }
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  async function generateInsight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const assessmentData = JSON.parse(newInsight.assessmentData || "{}");
      const res = await authenticatedFetch("/api/v1/ai/consultation-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: newInsight.patientId,
          transcript: newInsight.transcript,
          clinicalNotes: newInsight.clinicalNotes,
          assessmentData,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate insights");
      const data = await res.json();
      setInsights((prev) => [...data.insights, ...prev]);
      setNewInsight({ patientId: "", transcript: "", clinicalNotes: "", assessmentData: "{}" });
      setSelectedPatientId(newInsight.patientId);
      await loadInsights(newInsight.patientId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Failed to generate AI insights.");
    } finally {
      setBusy(false);
    }
  }

  async function dismissInsight(id: string) {
    try {
      await authenticatedFetch(`/api/v1/ai/insights/${id}/dismiss`, { method: "PATCH" });
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, dismissed: true } : i)));
    } catch {
      setError("Failed to dismiss insight.");
    }
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
          <Link href="/clinician" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
            NEUROCARE
          </Link>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            AI Clinical Insights · ADHD EHR
          </p>
        </div>
        <Link
          href="/clinician"
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
          ← Back to Clinic
        </Link>
      </header>

      <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 12px", letterSpacing: -0.02 }}>
        AI Clinical Insights
      </h1>
      <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 800 }}>
        AI-generated clinical insights for ADHD patients. Insights cover symptom patterns,
        medication response, risk prediction, titration adjustments, safety flags, and clinical reminders.
        All insights require clinician review.
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

      {/* Generate new insight */}
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
          Generate New AI Insight
        </h2>
        <form onSubmit={generateInsight} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Patient
            <select
              required
              value={newInsight.patientId}
              onChange={(e) => setNewInsight((prev) => ({ ...prev, patientId: e.target.value }))}
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
            Clinical Notes
            <textarea
              required
              value={newInsight.clinicalNotes}
              onChange={(e) => setNewInsight((prev) => ({ ...prev, clinicalNotes: e.target.value }))}
              rows={4}
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
            Assessment Data (JSON)
            <textarea
              required
              value={newInsight.assessmentData}
              onChange={(e) => setNewInsight((prev) => ({ ...prev, assessmentData: e.target.value }))}
              rows={3}
              placeholder='{"inattention": 7, "hyperactivity": 5, "sleepIssues": true}'
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                fontFamily: "monospace",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <button disabled={busy || !newInsight.patientId} style={{
            background: "#4e6ef2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontWeight: 800,
            cursor: "pointer",
            font: "inherit",
          }}>
            {busy ? "Generating…" : "Generate AI Insight"}
          </button>
        </form>
      </section>

      {/* Insights list */}
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
          Active Insights
        </h2>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading insights…</p>
        ) : insights.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14 }}>
            No AI insights yet. Generate an insight above to begin.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {insights.map((insight) => (
              <div
                key={insight.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fff",
                  borderLeft: `4px solid ${severityColor[insight.severity] ?? "#4e6ef2"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>
                    {insight.title}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: severityColor[insight.severity] ?? "#4e6ef2",
                    }}
                  >
                    {insight.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                  {insight.content}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#64748b",
                      fontSize: 11,
                    }}
                  >
                    <span>Confidence: {insight.confidence}%</span>
                    <span>· {new Date(insight.createdAt).toLocaleDateString("en-GB")}</span>
                  </div>
                  <button
                    onClick={() => void dismissInsight(insight.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
