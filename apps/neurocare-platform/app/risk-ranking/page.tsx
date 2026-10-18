"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "../../lib/client-api";

type RiskScore = {
  id: string;
  patientId: string;
  overallScore: number;
  riskBand: string;
  factors: Record<string, { score: number; label: string }>;
  reviewedAt: string;
  nextReviewDue: string | null;
  patient: { id: string; user: { firstName: string; lastName: string; email: string } };
  clinician: { id: string; firstName: string; lastName: string } | null;
};

type PatientRanking = {
  id: string;
  patientId: string;
  rankPosition: number;
  score: number;
  reason: string | null;
  portal: string;
  reviewedAt: string | null;
  patient: { id: string; user: { firstName: string; lastName: string; email: string } };
};

type SafetyAlert = {
  id: string;
  patientId: string;
  alertType: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
  patient: { id: string; user: { firstName: string; lastName: string } };
};

const bandColor = (band: string) => {
  switch (band) {
    case "CRITICAL": return "#7f1d1d";
    case "HIGH": return "#b91c1c";
    case "MODERATE": return "#d97706";
    default: return "#16a34a";
  }
};

const bandBg = (band: string) => {
  switch (band) {
    case "CRITICAL": return "#fef2f2";
    case "HIGH": return "#fef2f2";
    case "MODERATE": return "#fffbeb";
    default: return "#f0fdf4";
  }
};

export default function RiskRankingDashboard() {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [rankings, setRankings] = useState<PatientRanking[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/v1/clinical-risk/risk-scores"),
      authenticatedFetch("/api/v1/clinical-risk/rankings?portal=clinician"),
      authenticatedFetch("/api/v1/clinical-risk/safety-alerts?acknowledged=false"),
    ])
      .then(async ([sRes, rRes, aRes]) => {
        if (!active) return;
        if (!sRes.ok || !rRes.ok || !aRes.ok) {
          throw new Error("Failed to load clinical risk data");
        }
        setScores(await sRes.json());
        setRankings(await rRes.json());
        setAlerts(await aRes.json());
        setLoading(false);
      })
      .catch((reason) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "Unable to load risk dashboard.",
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function acknowledgeAlert(id: string) {
    await authenticatedFetch(`/api/v1/clinical-risk/safety-alerts/${id}/acknowledge`, {
      method: "PATCH",
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "24px clamp(20px, 5vw, 64px) 56px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <Link
              href="/clinician"
              style={{
                textDecoration: "none",
                fontWeight: 900,
                fontSize: 20,
                color: "#0f172a",
              }}
            >
              NEUROCARE
            </Link>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
              Clinical Risk Ranking · ADHD EHR
            </p>
          </div>
          <Link
            href="/uk-adhd"
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
            Assessment Forms →
          </Link>
        </header>

        <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 12px", letterSpacing: -0.02 }}>
          Patient Risk Ranking
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 800 }}>
          NICE-aligned risk stratification for ADHD patients. Prioritise clinical
          workload by computed risk score, with safety alerts and review cadence.
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

        {/* Summary cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: 800, letterSpacing: 1 }}>
              Total Patients
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, marginTop: 8, color: "#0f172a" }}>
              {scores.length}
            </div>
          </div>
          {["CRITICAL", "HIGH", "MODERATE", "LOW"].map((band) => {
            const count = scores.filter((s) => s.riskBand === band).length;
            return (
              <div
                key={band}
                style={{
                  background: "#ffffff",
                  border: `1px solid ${bandColor(band)}33`,
                  borderRadius: 14,
                  padding: 20,
                  borderLeft: `4px solid ${bandColor(band)}`,
                }}
              >
                <div style={{ color: bandColor(band), fontSize: 11, textTransform: "uppercase", fontWeight: 800, letterSpacing: 1 }}>
                  {band} Risk
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, marginTop: 8, color: bandColor(band) }}>
                  {count}
                </div>
              </div>
            );
          })}
        </section>

        {/* Safety alerts */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
                Active Safety Alerts
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                Unacknowledged clinical safety alerts requiring attention
              </p>
            </div>
            {alerts.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#b91c1c",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {alerts.length} active
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14 }}>
              No active safety alerts. All patients are within safe parameters.
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
                    border: "1px solid #f1f5f9",
                    borderRadius: 10,
                    background: alert.severity === "CRITICAL" ? "#fef2f2" : "#ffffff",
                    borderLeft: `4px solid ${bandColor(alert.severity)}`,
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
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                      {alert.patient.user.firstName} {alert.patient.user.lastName}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      {alert.message}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: bandColor(alert.severity),
                    }}
                  >
                    {alert.alertType}
                  </span>
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

        {/* Rankings table */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
            Prioritised Patient Worklist
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                color: "#334155",
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#64748b",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: 1,
                    borderBottom: "2px solid #f1f5f9",
                  }}
                >
                  <th style={{ padding: "12px 16px" }}>Rank</th>
                  <th style={{ padding: "12px 16px" }}>Patient</th>
                  <th style={{ padding: "12px 16px" }}>Score</th>
                  <th style={{ padding: "12px 16px" }}>Risk Band</th>
                  <th style={{ padding: "12px 16px" }}>Key Factors</th>
                  <th style={{ padding: "12px 16px" }}>Next Review</th>
                  <th style={{ padding: "12px 16px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rankings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      No ranked patients yet. Run ranking recompute from the admin
                      portal, or complete clinical risk assessments.
                    </td>
                  </tr>
                ) : (
                  rankings.map((rank) => {
                    const score = scores.find((s) => s.patientId === rank.patientId);
                    const band = score?.riskBand ?? "LOW";
                    return (
                      <tr
                        key={rank.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: rank.rankPosition <= 3 ? "#fefbff" : "#ffffff",
                        }}
                      >
                        <td style={{ padding: "12px 16px", fontWeight: 900, color: bandColor(band) }}>
                          #{rank.rankPosition}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                          {rank.patient.user.firstName} {rank.patient.user.lastName}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: bandColor(band) }}>
                          {score?.overallScore ?? rank.score}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: bandBg(band),
                              color: bandColor(band),
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {band}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12, maxWidth: 200 }}>
                          {score?.factors
                            ? Object.entries(score.factors)
                                .slice(0, 3)
                                .map(([k, v]) => `${k}: ${v.score}`)
                                .join(" · ")
                            : "-"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>
                          {score?.nextReviewDue ? new Date(score.nextReviewDue).toLocaleDateString("en-GB") : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link
                            href={`/patient/${rank.patientId}`}
                            style={{
                              color: "#4e6ef2",
                              fontWeight: 700,
                              textDecoration: "none",
                              fontSize: 12,
                            }}
                          >
                            Open record →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
