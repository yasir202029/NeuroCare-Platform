import Link from "next/link";

export const metadata = {
  title: "About — NeuroCare Platform",
  description:
    "NeuroCare is a clinical operations platform for UK remote ADHD clinics. Connect patients, clinicians, prescribers, and GPs through a single audited care record.",
  openGraph: {
    title: "About — NeuroCare Platform",
    description:
      "NeuroCare is a clinical operations platform for UK remote ADHD clinics.",
    type: "website",
  },
};


export default function AboutPage() {
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
          <nav style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
            <Link href="/" style={{ color: "#6b7280", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Home
            </Link>
            <Link href="/contact" style={{ color: "#6b7280", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Contact
            </Link>
            <Link href="/login" style={{ color: "#145742", border: "1px solid #cbd9d2", background: "#fff", padding: "8px 16px", borderRadius: 6, fontWeight: 700, textDecoration: "none" }}>
              Sign in
            </Link>
          </nav>
        </header>

        <section style={{ marginBottom: 64 }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.05, margin: "0 0 16px", letterSpacing: -0.02 }}>
            Remote ADHD assessment,&nbsp;<br />shared care, connected.
          </h1>
          <p
            style={{
              maxWidth: 700,
              fontSize: 18,
              lineHeight: 1.6,
              color: "#44556f",
              marginBottom: 32,
            }}
          >
            NeuroCare is a clinical operations platform for UK remote ADHD
            clinics. Connect patients, clinicians, prescribers, and GPs through
            a single audited care record with NICE-aligned pathways, dynamic
            clinical forms, and real-time safety monitoring.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            marginBottom: 64,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                fontSize: 24,
              }}
            >
              🏥
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>
              Remote Assessment
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              Complete ADHD assessments online with dynamic clinical forms and
              audited pathways. NICE-aligned stratification and risk scoring.
            </p>
          </div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                fontSize: 24,
              }}
            >
              💊
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>
              Medication Titration
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              Monitor dose response, side effects and physical health with
              shared care agreements and GP communication.
            </p>
          </div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                fontSize: 24,
              }}
            >
              📋
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 12px" }}>
              Shared Care
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              Send assessments and medications to GPs with shared care
              agreements. GP record updates flow back into the patient record.
            </p>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            padding: 48,
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 20px" }}>
            Who uses NeuroCare
          </h2>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 200, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: "#15233a" }}>
                Patients
              </h4>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                Book appointments, message care teams, track medication and view
                care plans.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: "#15233a" }}>
                Clinicians
              </h4>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                Manage assessments, record sessions, review patient progress and
                coordinate care.
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: "#15233a" }}>
                GPs &amp; Shared Care
              </h4>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                Receive shared care documentation and submit record updates back
                to the clinic.
              </p>
            </div>
          </div>
        </section>

        <footer
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: "1px solid #e2e8f0",
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          <p style={{ margin: 0 }}>
            NeuroCare Platform — Remote ADHD Assessment &amp; Shared Care.
            Clinical decision support requires clinician review.
          </p>
        </footer>
      </div>
    </div>
  );
}
