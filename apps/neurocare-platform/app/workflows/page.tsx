"use client";



const nodes = [
  { id: "referral", label: "Referral", x: 40, y: 120 },
  { id: "triage", label: "Admin Triage", x: 260, y: 120 },
  { id: "assessment", label: "Assessment", x: 520, y: 40 },
  { id: "review", label: "Assessment Review", x: 520, y: 220 },
  { id: "outcome", label: "Outcome", x: 800, y: 120 },
  { id: "titration", label: "Titration", x: 1040, y: 30 },
  { id: "prescribing", label: "Prescribing", x: 1040, y: 170 },
  { id: "shared-care", label: "Shared Care", x: 1300, y: 120 },
  { id: "discharge", label: "Discharge", x: 1560, y: 120 },
];

const edges = [
  { from: "referral", to: "triage", startX: 160, startY: 120, endX: 260, endY: 120 },
  { from: "triage", to: "assessment", startX: 360, startY: 120, endX: 520, endY: 40 },
  { from: "triage", to: "review", startX: 360, startY: 120, endX: 520, endY: 220 },
  { from: "assessment", to: "outcome", startX: 620, startY: 40, endX: 800, endY: 120 },
  { from: "review", to: "outcome", startX: 620, startY: 220, endX: 800, endY: 120 },
  { from: "outcome", to: "titration", startX: 900, startY: 120, endX: 1040, endY: 30 },
  { from: "outcome", to: "prescribing", startX: 900, startY: 120, endX: 1040, endY: 170 },
  { from: "titration", to: "shared-care", startX: 1140, startY: 30, endX: 1300, endY: 120 },
  { from: "prescribing", to: "shared-care", startX: 1140, startY: 170, endX: 1300, endY: 120 },
  { from: "shared-care", to: "discharge", startX: 1400, startY: 120, endX: 1560, endY: 120 },
];

export default function WorkflowPage() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        minHeight: "100vh",
        background: "#f3f6f8",
        color: "#15233a",
      }}
    >
      <aside style={{ background: "#12213f", color: "#eff5ff", padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Workflow engine</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          <li>Referral intake</li>
          <li>Assessment triage</li>
          <li>Clinical outcome</li>
          <li>Medication pathway</li>
          <li>Shared care handoff</li>
        </ul>
      </aside>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#5d6e94", textTransform: "uppercase", letterSpacing: 2, fontSize: 11, fontWeight: 700 }}>
              Care pathway board
            </p>
            <h1 style={{ margin: "8px 0 0" }}>Integrated patient workflow</h1>
          </div>
          <a href="/engine" style={{ color: "#4e6ef2", textDecoration: "none", fontWeight: 700 }}>
            Open engine →
          </a>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "calc(100vh - 120px)",
            background: "#fff",
            border: "1px solid #e3ebf7",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
            preserveAspectRatio="xMinYMin meet"
          >
            {edges.map((edge) => (
              <path
                key={`${edge.from}-${edge.to}`}
                d={`M ${edge.startX} ${edge.startY} C ${edge.startX + 80} ${edge.startY}, ${edge.endX - 80} ${edge.endY}, ${edge.endX} ${edge.endY}`}
                stroke="#b8c9ef"
                strokeWidth="2.5"
                fill="transparent"
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                width: 160,
                background: "#f5f9ff",
                border: "1px solid #dfe8f5",
                borderRadius: 14,
                padding: "14px 12px",
                textAlign: "center",
                boxShadow: "0 8px 22px rgba(31, 65, 116, 0.08)",
                zIndex: 1,
              }}
            >
              {node.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
