"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../components/admin-shell";
import { getAccessToken } from "../lib/session";

type CommandCenter = {
  metrics: {
    patients: number;
    appointments: number;
    assessments: number;
    openTasks: number;
    openComplaints: number;
    auditAlerts: number;
  };
  taskQueues: Array<{ type: string; count: number }>;
  workflow: Array<{ stage: string; count: number }>;
};

// API calls go through the same origin and are proxied to the backend by the
// rewrite in next.config.mjs, so the browser never makes a cross-origin call.
const apiBase = "/api/v1";

export default function AdminHomePage() {
  const [data, setData] = useState<CommandCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState("operations");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Sign in with an administrator account.");
      const response = await fetch(`${apiBase}/admin/command-center`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Sign in with an administrator account.");
        if (response.status === 403)
          throw new Error("Your account is not authorised for operations access.");
        throw new Error("Unable to load operational data.");
      }
      setData(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load operational data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell active={section} onSelect={setSection}>
      <header className="ops-header">
        <div>
          <p className="eyebrow">Live operational data</p>
          <h1>Operations</h1>
          <p className="muted">What is preventing the service from operating smoothly?</p>
        </div>
        <button className="ops-action" onClick={() => void load()}>
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="ops-error">
          <p>{error}</p>
          {error.startsWith("Sign in") ? (
            <a className="ops-action" href="/login" style={{ display: "inline-block" }}>
              Sign in
            </a>
          ) : (
            <button className="ops-action" onClick={() => void load()}>
              Retry
            </button>
          )}
        </div>
      )}

      {loading && <p className="muted">Loading operational state…</p>}

      {data && !loading && (
        <>
          <section aria-labelledby="service-now" className="ops-block">
            <h2 id="service-now">Service now</h2>
            <div className="ops-metrics">
              <div className="ops-metric">
                <span>Open clinical tasks</span>
                <strong>{data.metrics.openTasks}</strong>
              </div>
              <div className="ops-metric">
                <span>Unresolved complaints</span>
                <strong>{data.metrics.openComplaints}</strong>
              </div>
              <div className="ops-metric">
                <span>Audit warnings</span>
                <strong>{data.metrics.auditAlerts}</strong>
              </div>
              <div className="ops-metric">
                <span>Active appointments</span>
                <strong>{data.metrics.appointments}</strong>
              </div>
            </div>
          </section>

          <section aria-labelledby="pipeline" className="ops-block">
            <h2 id="pipeline">Patient pipeline</h2>
            {data.workflow.length === 0 ? (
              <p className="muted">No pathway transitions recorded yet.</p>
            ) : (
              <table className="ops-table">
                <caption className="sr-only">Patients by current pathway stage</caption>
                <thead>
                  <tr>
                    <th scope="col">Stage</th>
                    <th scope="col">Patients</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workflow.map((row) => (
                    <tr key={row.stage}>
                      <th scope="row">{row.stage.replaceAll("_", " ")}</th>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section aria-labelledby="queues" className="ops-block">
            <h2 id="queues">Operational queues</h2>
            {data.taskQueues.length === 0 ? (
              <p className="muted">No open operational queues.</p>
            ) : (
              <table className="ops-table">
                <caption className="sr-only">Open items by queue type</caption>
                <thead>
                  <tr>
                    <th scope="col">Queue</th>
                    <th scope="col">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {data.taskQueues.map((row) => (
                    <tr key={row.type}>
                      <th scope="row">{row.type.replaceAll("_", " ")}</th>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
