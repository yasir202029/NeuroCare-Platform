"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { authenticatedFetch } from "../lib/client-api";

type Snapshot = {
  states: string[];
  rules: { id: string; from: string[]; to: string[]; description: string }[];
  workflow: { state: string; count: number }[];
  tasks: { type: string; status: string; count: number }[];
  events: {
    id: string;
    action: string;
    resource: string;
    createdAt: string;
    actor?: { firstName: string; lastName: string } | null;
  }[];
};

const views = [
  "engine",
  "workflows",
  "rules",
  "events",
  "states",
  "tasks",
] as const;
export function EngineConsole({ view }: { view: (typeof views)[number] }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [command, setCommand] = useState({ patientId: "", toStage: "", reason: "", teamId: "" });
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [commandBusy, setCommandBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    authenticatedFetch("/api/v1/engine", {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Sign in with an authorised staff account to access the Engine."
              : "The Engine data service is unavailable.",
          );
        }
        return response.json() as Promise<Snapshot>;
      })
      .then((snapshot) => {
        setData(snapshot);
        setError(null);
      })
      .catch((reason: unknown) => {
        if ((reason as Error).name === "AbortError") {
          return;
        }
        setData(null);
        setError(
          reason instanceof Error
            ? reason.message
            : "The Engine data service is unavailable.",
        );
      });

    return () => controller.abort();
  }, []);

  const resolvedData = data;
  const title =
    view === "engine"
      ? "NeuroCare Engine"
      : `${view[0].toUpperCase()}${view.slice(1)} controller`;

  async function reload() {
    try {
      const response = await authenticatedFetch("/api/v1/engine", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("The Engine data service is unavailable.");
      setData((await response.json()) as Snapshot);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The Engine data service is unavailable.",
      );
    }
  }

  async function runTransition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCommandBusy(true);
    setCommandResult(null);
    setCommandError(null);
    try {
      if (!command.patientId || !command.toStage || !command.reason) {
        throw new Error("Patient, target stage and reason are required.");
      }
      const response = await authenticatedFetch(
        "/api/v1/engine/workflows/transition",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId: command.patientId.trim(),
            toStage: command.toStage,
            reason: command.reason.trim(),
            ...(command.teamId.trim()
              ? { teamId: command.teamId.trim() }
              : {}),
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error?.message ??
            payload?.message ??
            `Transition failed (${response.status}).`,
        );
      }
      const next = Array.isArray(payload?.next) ? payload.next.join(", ") : "—";
      setCommandResult(
        `Transition recorded: ${payload?.workflow?.fromStage ?? "INITIAL"} → ${payload?.workflow?.toStage ?? command.toStage}. Next permitted: ${next}.`,
      );
      await reload();
    } catch (reason) {
      setCommandError(
        reason instanceof Error ? reason.message : "Transition failed.",
      );
    } finally {
      setCommandBusy(false);
    }
  }

  async function completeTask(taskId: string) {
    setCommandBusy(true);
    setCommandResult(null);
    setCommandError(null);
    try {
      const response = await authenticatedFetch(
        `/api/v1/engine/tasks/${taskId}/complete`,
        { method: "POST", credentials: "include" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error?.message ??
            payload?.message ??
            `Task completion failed (${response.status}).`,
        );
      }
      setCommandResult(`Task completed: ${payload?.id ?? taskId}.`);
      await reload();
    } catch (reason) {
      setCommandError(
        reason instanceof Error ? reason.message : "Task completion failed.",
      );
    } finally {
      setCommandBusy(false);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "250px 1fr",
        minHeight: "100vh",
        background: "#f3f6f8",
        color: "#15233a",
      }}
    >
      <aside
        style={{
          background: "#12213f",
          color: "#f4f7ff",
          padding: "24px 18px",
          display: "grid",
          gap: 20,
        }}
      >
        <Link
          href="/engine"
          style={{
            textDecoration: "none",
            color: "#fff",
            fontSize: 30,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 8,
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
          <span>NeuroCare Engine</span>
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
          Control plane
        </p>

        <nav style={{ display: "grid", gap: 8 }}>
          {views.map((item) => (
            <Link
              key={item}
              href={`/${item}`}
              style={{
                textDecoration: "none",
                background:
                  view === item ? "rgba(78,110,242,0.18)" : "transparent",
                borderRadius: 10,
                padding: "10px 12px",
                color: view === item ? "#fff" : "#dfe8ff",
                fontWeight: 600,
              }}
            >
              {item}
            </Link>
          ))}
        </nav>

        <Link
          href="/admin"
          style={{
            textDecoration: "none",
            color: "#dfe8ff",
            marginTop: "auto",
          }}
        >
          ← Admin Portal
        </Link>
      </aside>

      <section style={{ padding: 30 }}>
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
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5d6e94",
                fontWeight: 700,
              }}
            >
              Shared workflow control plane
            </p>
            <h1
              style={{
                margin: "12px 0 8px",
                fontSize: "clamp(2rem, 3vw, 3rem)",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                margin: 0,
                color: "#4c5d7a",
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              Rules, states, tasks, events and portal decisions are resolved
              here. Portals submit commands and render the resulting authorised
              work.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => window.location.assign("/admin")}
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
              Open Admin controller
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.assign("/login");
              }}
              style={{
                background: "transparent",
                border: "1px solid #cbd5e1",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#fff8dd",
              border: "1px solid #f4d38c",
              color: "#7b5a00",
            }}
          >
            {error}{" "}
            {error.includes("Sign in") && (
              <Link
                href="/login?next=%2Fengine"
                style={{ marginLeft: 8, color: "#145742", fontWeight: 700 }}
              >
                Sign in →
              </Link>
            )}
          </div>
        )}

        {!data && !error && (
          <p role="status">Loading authorised engine data…</p>
        )}

        {view === "states" && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            {(resolvedData?.states ?? []).map((state) => (
              <article
                key={state}
                style={{
                  background: "#fff",
                  border: "1px solid #e2ebf5",
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <small
                  style={{
                    color: "#667998",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                  }}
                >
                  Workflow state
                </small>
                <h2 style={{ margin: "12px 0 12px", fontSize: 24 }}>
                  {state.replace(/_/g, " ")}
                </h2>
                <Link
                  href="/workflows"
                  style={{
                    color: "#4e6ef2",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Inspect transitions →
                </Link>
              </article>
            ))}
          </section>
        )}

        {view === "rules" && (
          <section style={{ display: "grid", gap: 18 }}>
            {(resolvedData?.rules ?? []).map((rule) => (
              <article
                key={rule.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2ebf5",
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <small
                  style={{
                    color: "#667998",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                  }}
                >
                  From{" "}
                  {rule.from
                    .map((state) => state.replace(/_/g, " "))
                    .join(", ")}
                </small>
                <h2 style={{ margin: "12px 0 8px" }}>{rule.description}</h2>
                <p style={{ margin: 0, color: "#415574" }}>
                  Next:{" "}
                  {rule.to.map((state) => state.replace(/_/g, " ")).join(" → ")}
                </p>
                <div style={{ marginTop: 12 }}>
                  <Link
                    href="/workflows"
                    style={{
                      color: "#4e6ef2",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Open pathway →
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}

        {view === "events" && (
          <section style={{ display: "grid", gap: 18 }}>
            {(resolvedData?.events ?? []).map((event) => (
              <article
                key={event.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2ebf5",
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <small style={{ color: "#667998" }}>
                  {new Date(event.createdAt).toLocaleString()}
                </small>
                <h2 style={{ margin: "10px 0 6px" }}>
                  {event.action.replace(/_/g, " ")}
                </h2>
                <p style={{ margin: 0, color: "#415574" }}>
                  {event.resource} ·{" "}
                  {event.actor
                    ? `${event.actor.firstName} ${event.actor.lastName}`
                    : "System"}
                </p>
              </article>
            ))}
          </section>
        )}

        {(view === "engine" || view === "workflows") && data && (
          <section
            style={{
              background: "#fff",
              border: "1px solid #e2ebf5",
              borderRadius: 16,
              padding: 18,
              marginBottom: 20,
            }}
          >
            <h2 style={{ margin: "0 0 6px" }}>Run Engine transition</h2>
            <p style={{ margin: "0 0 14px", color: "#415574" }}>
              Execute an authorised workflow command. State, queue, audit and
              next actions update in one transaction.
            </p>
            <form
              onSubmit={(event) => void runTransition(event)}
              style={{ display: "grid", gap: 10, maxWidth: 640 }}
            >
              <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
                Patient ID
                <input
                  value={command.patientId}
                  onChange={(event) =>
                    setCommand((prev) => ({
                      ...prev,
                      patientId: event.target.value,
                    }))
                  }
                  placeholder="cuid…"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    font: "inherit",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
                Target stage
                <select
                  value={command.toStage}
                  onChange={(event) =>
                    setCommand((prev) => ({
                      ...prev,
                      toStage: event.target.value,
                    }))
                  }
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    font: "inherit",
                  }}
                >
                  <option value="">Select stage…</option>
                  {(resolvedData?.states ?? []).map((state) => (
                    <option key={state} value={state}>
                      {state.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
                Reason
                <input
                  value={command.reason}
                  onChange={(event) =>
                    setCommand((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Clinical or operational reason…"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    font: "inherit",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
                Team ID (optional — creates queue item)
                <input
                  value={command.teamId}
                  onChange={(event) =>
                    setCommand((prev) => ({
                      ...prev,
                      teamId: event.target.value,
                    }))
                  }
                  placeholder="cuid…"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    font: "inherit",
                  }}
                />
              </label>
              <button
                type="submit"
                disabled={commandBusy}
                style={{
                  background: "#4e6ef2",
                  color: "#fff",
                  border: "none",
                  padding: "12px 16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  borderRadius: 8,
                }}
              >
                {commandBusy ? "Running…" : "Run transition"}
              </button>
            </form>
            {(commandResult || commandError) && (
              <p
                role={commandError ? "alert" : "status"}
                style={{
                  marginTop: 12,
                  color: commandError ? "#9c3f31" : "#145742",
                }}
              >
                {commandError ?? commandResult}
              </p>
            )}
          </section>
        )}

        {(view === "engine" || view === "tasks" || view === "workflows") && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            {(view === "tasks"
              ? (resolvedData?.tasks ?? []).map((item) => ({
                  title: item.type.replace(/_/g, " "),
                  value: item.count,
                  label: item.status,
                }))
              : (resolvedData?.workflow ?? []).map((item) => ({
                  title: item.state.replace(/_/g, " "),
                  value: item.count,
                  label: "Active cases",
                }))
            ).map((item) => (
              <article
                key={`${item.title}-${item.label}`}
                style={{
                  background: "#fff",
                  border: "1px solid #e2ebf5",
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <small
                  style={{
                    color: "#667998",
                    textTransform: "uppercase",
                    letterSpacing: 1.4,
                  }}
                >
                  {item.label}
                </small>
                <strong
                  style={{ display: "block", fontSize: 34, marginTop: 12 }}
                >
                  {item.value}
                </strong>
                <h2 style={{ margin: "10px 0 8px" }}>{item.title}</h2>
                <Link
                  href="/admin"
                  style={{
                    color: "#4e6ef2",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Control from Admin →
                </Link>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
