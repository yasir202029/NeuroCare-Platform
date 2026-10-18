"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "../../lib/client-api";

type Snapshot = {
  states: string[];
  rules: { id: string; from: string[]; to: string[]; description: string }[];
  workflow: { state: string; count: number }[];
};

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  REFERRAL: { bg: "#eef4ff", border: "#b9cff7", text: "#1e4fa3" },
  ADMIN_TRIAGE: { bg: "#f0edff", border: "#c9bef7", text: "#4f35a8" },
  ASSESSMENT: { bg: "#e7f6f1", border: "#a5dccd", text: "#0d6b52" },
  DIAGNOSIS: { bg: "#e5f2ff", border: "#a8cdf2", text: "#14548e" },
  MORE_INFORMATION_REQUIRED: { bg: "#fff6e2", border: "#f0d69a", text: "#8a6208" },
  ECG_REQUESTED: { bg: "#fdeef2", border: "#f2b8c9", text: "#a81e51" },
  ASSESSMENT_REVIEW: { bg: "#e9f0ff", border: "#b5c9f5", text: "#2b4d9b" },
  TITRATION: { bg: "#e6f7ee", border: "#9fdec4", text: "#0a7a52" },
  PRESCRIBING: { bg: "#e2f4fb", border: "#a4d7ee", text: "#0e6a93" },
  SHARED_CARE: { bg: "#efeaff", border: "#c8b8f2", text: "#5535a5" },
  DISCHARGE: { bg: "#f1f3f5", border: "#c3ccd4", text: "#42525f" },
  OUTCOME: { bg: "#e4faf3", border: "#96e0c8", text: "#076e50" },
  DIAGNOSIS_NOT_CONFIRMED: { bg: "#fff0ec", border: "#f1bda8", text: "#96381a" },
};
const FALLBACK = { bg: "#f1f5f9", border: "#c9d6e2", text: "#3d5568" };
const stageColor = (state: string) => STAGE_COLORS[state] ?? FALLBACK;

const NODE_POS: Record<string, { x: number; y: number }> = {
  REFERRAL: { x: 30, y: 190 },
  ADMIN_TRIAGE: { x: 230, y: 190 },
  ASSESSMENT: { x: 470, y: 90 },
  ASSESSMENT_REVIEW: { x: 470, y: 290 },
  MORE_INFORMATION_REQUIRED: { x: 470, y: 440 },
  ECG_REQUESTED: { x: 470, y: 560 },
  DIAGNOSIS: { x: 740, y: 90 },
  OUTCOME: { x: 980, y: 190 },
  TITRATION: { x: 1220, y: 60 },
  PRESCRIBING: { x: 1220, y: 190 },
  SHARED_CARE: { x: 1470, y: 125 },
  DISCHARGE: { x: 1700, y: 125 },
  DIAGNOSIS_NOT_CONFIRMED: { x: 740, y: 290 },
};

const NODE_W = 178;
const NODE_H = 76;

export default function WorkflowPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    authenticatedFetch("/api/v1/engine", { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Sign in with an authorised staff account to view live workflow data.");
        return (await response.json()) as Snapshot;
      })
      .then((snapshot) => { setData(snapshot); setError(null); })
      .catch((reason: unknown) => {
        if ((reason as Error).name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "The Engine data service is unavailable.");
      });
    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of data?.workflow ?? []) map.set(item.state, item.count);
    return map;
  }, [data]);

  const edges = useMemo(() => {
    const list: { id: string; from: string; to: string }[] = [];
    for (const rule of data?.rules ?? []) {
      for (const from of rule.from) {
        for (const to of rule.to) {
          if (NODE_POS[from] && NODE_POS[to]) list.push({ id: `${rule.id}:${from}>${to}`, from, to });
        }
      }
    }
    return list;
  }, [data]);

  const totalActive = useMemo(() => [...counts.values()].reduce((sum, count) => sum + count, 0), [counts]);

  return (
    <main style={{ minHeight: "100vh", background: "#f3f6f8", color: "#15233a" }}>
      <header
        style={{
          background: "linear-gradient(120deg, #0d3b34 0%, #14584c 55%, #1b7a63 100%)",
          color: "#fff",
          padding: "34px clamp(20px, 4vw, 56px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: "#9fe8cf", fontWeight: 800 }}>
            Care pathway board
          </p>
          <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", letterSpacing: "-0.03em" }}>
            Integrated patient workflow
          </h1>
          <p style={{ margin: 0, color: "#c5e8dc", fontSize: 16, lineHeight: 1.6, maxWidth: 640 }}>
            Live branch map rendered directly from the Engine rule set. Colours mark pathway
            families; numbers show active cases in each state.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 14,
              padding: "14px 20px",
              textAlign: "center",
            }}
          >
            <strong style={{ display: "block", fontSize: 30 }}>{totalActive}</strong>
            <small style={{ color: "#bde9d6", fontSize: 12, letterSpacing: 1 }}>ACTIVE CASES</small>
          </div>
          <Link
            href="/engine"
            style={{
              background: "#fff",
              color: "#14584c",
              textDecoration: "none",
              fontWeight: 700,
              borderRadius: 12,
              padding: "12px 18px",
              border: "1px solid rgba(255,255,255,.4)",
            }}
          >
            Open Engine →
          </Link>
        </div>
      </header>

      {error && (
        <div
          style={{
            margin: "22px clamp(20px, 4vw, 56px)",
            padding: "12px 16px",
            borderRadius: 12,
            background: "#fff6dd",
            border: "1px solid #ead28d",
            color: "#735711",
          }}
        >
          {error}{" "}
          <Link href="/login?next=%2Fworkflows" style={{ color: "#14584c", fontWeight: 700, marginLeft: 6 }}>
            Sign in →
          </Link>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          padding: "18px clamp(20px, 4vw, 56px)",
          alignItems: "center",
        }}
      >
        <small style={{ fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#5d6e94", fontSize: 11 }}>
          Pathway families
        </small>
        {[
          { label: "Intake", color: "#b9cff7", states: "Referral → Triage" },
          { label: "Clinical", color: "#a5dccd", states: "Assessment / Review / Diagnosis" },
          { label: "Waiting", color: "#f0d69a", states: "More info / ECG" },
          { label: "Medication", color: "#9fdec4", states: "Titration → Prescribing" },
          { label: "Handover", color: "#c8b8f2", states: "Shared care" },
          { label: "Exit", color: "#c3ccd4", states: "Discharge / Not confirmed" },
        ].map((family) => (
          <span
            key={family.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#fff",
              border: "1px solid #e2ebf5",
              borderRadius: 20,
              padding: "6px 13px",
              fontSize: 12,
              color: "#415574",
            }}
          >
            <i style={{ width: 11, height: 11, borderRadius: 4, background: family.color, display: "inline-block" }} />
            <strong style={{ color: "#15233a" }}>{family.label}</strong>
            <span style={{ color: "#7b8ba4" }}>· {family.states}</span>
          </span>
        ))}
      </div>

      <section
        style={{
          margin: "0 clamp(20px, 4vw, 56px) 28px",
          background: "#fff",
          border: "1px solid #e2ebf5",
          borderRadius: 20,
          overflow: "auto",
          boxShadow: "0 10px 34px rgba(21, 62, 52, 0.07)",
        }}
      >
        <div style={{ position: "relative", minWidth: 1930, minHeight: 680 }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="xMinYMin meet">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9db8d4" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const a = NODE_POS[edge.from];
              const b = NODE_POS[edge.to];
              if (!a || !b) return null;
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const mid = (x1 + x2) / 2;
              const dim = hovered && hovered !== edge.from && hovered !== edge.to;
              const color = stageColor(edge.to).border;
              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                  stroke={dim ? "#e4ecf4" : color}
                  strokeWidth={dim ? 1.5 : 2.5}
                  fill="transparent"
                  markerEnd="url(#arrow)"
                  opacity={dim ? 0.4 : 1}
                />
              );
            })}
          </svg>

          {(data?.states ?? Object.keys(NODE_POS)).map((state) => {
            const pos = NODE_POS[state];
            if (!pos) return null;
            const c = stageColor(state);
            const count = counts.get(state) ?? 0;
            const dim = hovered && hovered !== state;
            const isHovered = hovered === state;
            return (
              <div
                key={state}
                onMouseEnter={() => setHovered(state)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                  background: c.bg,
                  border: `1px solid ${isHovered ? c.text : c.border}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  boxShadow: isHovered ? "0 10px 26px rgba(31,65,116,.14)" : "0 6px 18px rgba(31, 65, 116, 0.07)",
                  opacity: dim ? 0.45 : 1,
                  transform: isHovered ? "translateY(-3px)" : undefined,
                  transition: "opacity .18s, transform .18s, box-shadow .18s",
                  zIndex: 1,
                }}
              >
                <small
                  style={{
                    display: "block",
                    fontSize: 10,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    fontWeight: 800,
                    color: c.text,
                    opacity: 0.75,
                  }}
                >
                  State
                </small>
                <strong style={{ display: "block", fontSize: 14, lineHeight: 1.25, marginTop: 4, color: "#15233a" }}>
                  {state.replace(/_/g, " ")}
                </strong>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 7,
                    fontSize: 11,
                    fontWeight: 800,
                    color: count > 0 ? c.text : "#8496a8",
                    background: count > 0 ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.45)",
                    border: `1px solid ${count > 0 ? c.border : "#dbe4ec"}`,
                    borderRadius: 10,
                    padding: "2px 9px",
                  }}
                >
                  {count} active
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ padding: "0 clamp(20px, 4vw, 56px) 40px" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, letterSpacing: "-0.02em" }}>Branch rules</h2>
        <p style={{ margin: "0 0 18px", color: "#4c5d7a" }}>
          Each rule is a permitted branch set. Hover a state on the map above to isolate its edges.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {(data?.rules ?? []).map((rule, index) => {
            const primary = stageColor(rule.to[0] ?? rule.from[0]);
            return (
              <article
                key={rule.id}
                onMouseEnter={() => setHovered(rule.from[0])}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: "#fff",
                  border: "1px solid #e2ebf5",
                  borderLeft: `4px solid ${primary.border}`,
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 6px 18px rgba(21, 62, 52, 0.05)",
                }}
              >
                <small style={{ color: "#667998", textTransform: "uppercase", letterSpacing: 1.5, fontSize: 10, fontWeight: 800 }}>
                  Rule {String(index + 1).padStart(2, "0")} · {rule.id}
                </small>
                <h3 style={{ margin: "10px 0 8px", fontSize: 15, lineHeight: 1.45 }}>{rule.description}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {rule.from.map((state) => (
                    <span key={state} style={badgeStyle(stageColor(state))}>
                      {state.replace(/_/g, " ")}
                    </span>
                  ))}
                  <span style={{ color: "#7b8ba4", fontWeight: 800 }}>→</span>
                  {rule.to.map((state) => (
                    <span key={state} style={badgeStyle(stageColor(state))}>
                      {state.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function badgeStyle(c: { bg: string; border: string; text: string }) {
  return {
    fontSize: 11,
    fontWeight: 700,
    background: c.bg,
    border: `1px solid ${c.border}`,
    color: c.text,
    borderRadius: 8,
    padding: "3px 9px",
  } as const;
}
