import Link from "next/link";

export const metadata = {
  title: "Contact — NeuroCare Platform",
  description:
    "Get in touch with NeuroCare Platform for remote ADHD assessment and shared care services.",
  openGraph: {
    title: "Contact — NeuroCare Platform",
    description:
      "Get in touch with NeuroCare Platform for remote ADHD assessment and shared care services.",
    type: "website",
  },
};

export default function ContactPage() {
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
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header style={{ marginBottom: 48 }}>
          <Link href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#145742" }}>
            NEUROCARE
          </Link>
          <nav style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
            <Link href="/" style={{ color: "#6b7280", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Home
            </Link>
            <Link href="/about" style={{ color: "#6b7280", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              About
            </Link>
            <Link href="/login" style={{ color: "#145742", border: "1px solid #cbd9d2", background: "#fff", padding: "8px 16px", borderRadius: 6, fontWeight: 700, textDecoration: "none" }}>
              Sign in
            </Link>
          </nav>
        </header>

        <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, margin: "0 0 24px" }}>
          Get in touch
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>
          Whether you&rsquo;re a patient, clinician, GP practice, or
          organisation, we&rsquo;d love to hear from you.
        </p>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 40,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 24px" }}>
            Contact us
          </h2>
          <form
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div style={{ gridColumn: "span 2" }}>
              <label
                style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#374151" }}
              >
                Full name
              </label>
              <input
                type="text"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label
                style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#374151" }}
              >
                Email address
              </label>
              <input
                type="email"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label
                style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#374151" }}
              >
                Organisation (optional)
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label
                style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#374151" }}
              >
                How can we help?
              </label>
              <textarea
                required
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                gridColumn: "span 2",
                background: "#145742",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Send message
            </button>
          </form>
        </div>

        <section style={{ marginTop: 48, display: "grid", gap: 24 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 32,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px", color: "#15233a" }}>
              General enquiries
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
              Email: hello@neurocare.example.com<br />
              Phone: +44 20 7946 0958<br />
              Hours: Mon–Fri, 9am–5pm GMT
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
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px", color: "#15233a" }}>
              Clinical safety
            </h3>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
              For urgent clinical concerns, contact your local NHS service or
              call 111. NeuroCare is not an emergency service.
            </p>
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
