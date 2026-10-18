import Link from "next/link";

export const metadata = {
  title: "NeuroCare Platform — Remote ADHD Assessment & Shared Care",
  description:
    "Connected patient and clinical operations for remote ADHD assessment, titration, medication safety, and shared care in the UK.",
  openGraph: {
    title: "NeuroCare Platform — Remote ADHD Assessment & Shared Care",
    description:
      "Connected patient and clinical operations for remote ADHD assessment, titration, medication safety, and shared care in the UK.",
    type: "website",
  },
};

const branches = [
  {
    href: "/patient",
    label: "Patient",
    group: "CARE ACCESS",
    description:
      "Submit ADHD intake, update care information, request appointments and message your team.",
  },
  {
    href: "/clinician",
    label: "Clinician",
    group: "CLINICAL TEAM",
    description:
      "Publish sessions, confirm bookings, record attendance and reply to assigned patients.",
  },
  {
    href: "/titration",
    label: "Titration",
    group: "MEDICATION SAFETY",
    description:
      "Review ADHD dose response, side effects and follow-up for assigned cases.",
  },
  {
    href: "/prescriber",
    label: "Prescriber",
    group: "MEDICATION RELEASE",
    description:
      "Review assigned prescriptions, verify medication and sign authorised orders.",
  },
  {
    href: "/admin",
    label: "Administration",
    group: "CLINIC OPERATIONS",
    description:
      "Manage patient ownership, workflow queues, access and audit activity.",
  },
  {
    href: "/finance",
    label: "Finance",
    group: "REVENUE OPERATIONS",
    description:
      "Monitor service activity, invoices, payments and outstanding balances.",
  },
  {
    href: "/engine",
    label: "Engine control",
    group: "PLATFORM OPERATIONS",
    description:
      "Inspect workflow states, rules, tasks and audited transitions.",
  },
  {
    href: "/workflows",
    label: "Care pathway",
    group: "WORKFLOW VIEW",
    description:
      "Follow a case from referral intake through assessment, medication and discharge.",
  },
  {
    href: "/uk-adhd",
    label: "UK ADHD Clinic",
    group: "REMOTE ASSESSMENT",
    description:
      "Complete remote ADHD assessments with dynamic clinical forms and audited pathways.",
  },
  {
    href: "/risk-ranking",
    label: "Risk Ranking",
    group: "CLINICAL SAFETY",
    description:
      "NICE-aligned patient risk stratification and prioritised worklist for clinicians.",
  },
  {
    href: "/ai-insights",
    label: "AI Clinical Insights",
    group: "ADVANCED AI",
    description:
      "AI-generated clinical insights for symptom patterns, medication response, and risk prediction.",
  },
  {
    href: "/medication-safety",
    label: "Medication Safety",
    group: "ADVANCED AI",
    description:
      "AI-powered medication safety validation, interaction checks, and safety alerts.",
  },
  {
    href: "/letter-generator",
    label: "AI Letter Generator",
    group: "ADVANCED AI",
    description:
      "AI-assisted clinical correspondence: GP letters, shared care letters, and referral letters.",
  },
  {
    href: "/saas-admin",
    label: "SaaS Admin",
    group: "PLATFORM OPERATIONS",
    description:
      "Manage subscription plans, organizations, feature flags, and API keys.",
  },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f6f8",
        padding: "28px clamp(20px, 5vw, 64px) 56px",
        color: "#15233a",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 64,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: "#145742" }}>
            NEUROCARE
          </span>
          <Link
            href="/login"
            style={{
              color: "#145742",
              border: "1px solid #cbd9d2",
              background: "#fff",
              padding: "10px 15px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Sign in
          </Link>
        </header>
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: 12,
            fontWeight: 700,
            color: "#176550",
            marginBottom: 12,
          }}
        >
          Care delivery workspace
        </p>
        <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: "0 0 12px" }}>
          Choose your workspace
        </h1>
        <p
          style={{
            maxWidth: 700,
            fontSize: 17,
            lineHeight: 1.6,
            marginBottom: 32,
            color: "#44556f",
          }}
        >
          Each team works from a role-specific queue connected to the same care
          record and workflow engine.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
            gap: 12,
          }}
        >
          {branches.map((branch) => (
            <Link
              key={branch.href}
              href={branch.href}
              style={{
                background: "#ffffff",
                border: "1px solid #d6e1dc",
                borderRadius: 8,
                padding: 20,
                color: "#15233a",
                textDecoration: "none",
                minHeight: 176,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: "#176550",
                  fontWeight: 800,
                }}
              >
                {branch.group}
              </div>
              <div style={{ fontSize: 21, fontWeight: 750 }}>
                {branch.label}
              </div>
              <p
                style={{
                  color: "#52675e",
                  fontSize: 14,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {branch.description}
              </p>
              <span
                style={{
                  marginTop: "auto",
                  color: "#145742",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Open workspace →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
