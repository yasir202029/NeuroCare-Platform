"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";

export default function HealthDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/v1/coordination/summary"),
      authenticatedFetch("/api/v1/coordination/modules/health"),
    ])
      .then(async ([sRes, mRes]) => {
        if (!active) return;
        if (sRes.ok) setSummary(await sRes.json());
        if (mRes.ok) setModules(await mRes.json());
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f3f6f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-#145742" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    HEALTHY: "#16a34a",
    DEGRADED: "#d97706",
    DOWN: "#dc2626",
    MAINTENANCE: "#6b7280",
  };

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
          System Health
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          Real-time coordination status across all NeuroCare platform modules.
        </p>

        {summary && (
          <section style={{ marginBottom: 48 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#6b7280" }}>
                  Overall status
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    marginTop: 8,
                    color: statusColor[summary.overallStatus] || "#6b7280",
                  }}
                >
                  {summary.overallStatus}
                </div>
              </div>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#6b7280" }}>
                  Total modules
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8, color: "#15233a" }}>
                  {summary.totalModules}
                </div>
              </div>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#6b7280" }}>
                  Healthy
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8, color: "#16a34a" }}>
                  {summary.healthy}
                </div>
              </div>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#6b7280" }}>
                  Degraded / Down
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8, color: "#d97706" }}>
                  {summary.degraded + summary.down}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: "#6b7280",
                textAlign: "right",
              }}
            >
              Last updated: {new Date(summary.lastUpdated).toLocaleString()}
            </div>
          </section>
        )}

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px", color: "#145742" }}>
            Module status
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#6b7280",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Module</th>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Service</th>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 800, color: "#15233a" }}>Last check</th>
                </tr>
              </thead>
              <tbody>
                {(modules || []).map((m: any) => (
                  <tr key={`${m.module}:${m.serviceName}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#15233a" }}>
                      {m.module}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#4b5563" }}>{m.serviceName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: `${statusColor[m.status]}15`,
                          color: statusColor[m.status],
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: statusColor[m.status],
                            display: "inline-block",
                          }}
                        />
                        {m.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>
                      {m.lastCheck ? new Date(m.lastCheck).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
