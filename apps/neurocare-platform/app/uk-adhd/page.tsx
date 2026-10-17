"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "../../lib/client-api";
import { ClinicalFormRenderer } from "../../components/clinical-form-renderer";

type ClinicalForm = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  instrument: string | null;
  fields: Record<string, unknown>;
  active: boolean;
  _count: { submissions: number };
};

type FormSubmission = {
  id: string;
  formDefinitionId: string;
  patientId: string;
  answers: unknown;
  completedAt: string | null;
  createdAt: string;
  formDefinition: { id: string; key: string; name: string; category: string };
};

export default function UkAdhdPathwayPage() {
  const [forms, setForms] = useState<ClinicalForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [selectedForm, setSelectedForm] = useState<ClinicalForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      authenticatedFetch("/api/v1/clinical-forms?category=adhd&active=true"),
      authenticatedFetch("/api/v1/clinical-forms/submissions"),
    ])
      .then(async ([formsRes, subsRes]) => {
        if (!active) return;
        if (!formsRes.ok) throw new Error("Failed to load forms");
        if (!subsRes.ok) throw new Error("Failed to load submissions");
        setForms(await formsRes.json());
        setSubmissions(await subsRes.json());
        setLoading(false);
      })
      .catch((reason) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the UK ADHD clinic forms.",
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(answers: Record<string, unknown>) {
    if (!selectedForm) return;
    setSubmitting(true);
    try {
      const res = await authenticatedFetch("/api/v1/clinical-forms/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formDefinitionId: selectedForm.id,
          answers,
          completedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error?.message ?? "Submission failed");
      }
      const created = (await res.json()) as FormSubmission;
      setSubmissions((prev) => [created, ...prev]);
      setSelectedForm(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Form submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "28px clamp(20px, 5vw, 64px) 56px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div>
            <Link
              href="/"
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
              Remote ADHD Clinic · United Kingdom
            </p>
          </div>
          <Link
            href="/admin"
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
            ← Admin Portal
          </Link>
        </header>

        <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 10px", letterSpacing: -0.03 }}>
          ADHD Assessment Pathway
        </h1>
        <p style={{ color: "#64748b", fontSize: 17, lineHeight: 1.6, marginBottom: 32, maxWidth: 700 }}>
          Complete remote clinical assessments from intake through titration.
          Each form submission is audited, routed through the workflow engine,
          and visible across all care portals in real time.
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

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading assessment forms…</p>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>
                    Available Clinical Forms
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                    Select a form to begin your remote assessment
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {forms.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: 14 }}>
                    No active assessment forms available. Contact your clinic
                    administrator.
                  </p>
                ) : (
                  forms.map((form) => (
                    <button
                      key={form.id}
                      type="button"
                      onClick={() => setSelectedForm(form)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        border: `1px solid ${
                          selectedForm?.id === form.id ? "#4e6ef2" : "#e2e8f0"
                        }`,
                        borderRadius: 12,
                        background: selectedForm?.id === form.id ? "#eff6ff" : "#ffffff",
                        color: "#1e293b",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>
                          {form.name}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                          {form.description || "Clinical assessment form"}
                          {form.instrument && ` · ${form.instrument}`}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#4e6ef2" }}>
                        Open form →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            {selectedForm && (
              <section
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 24,
                  marginTop: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedForm(null)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontWeight: 700,
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: 13,
                      }}
                    >
                      ← Back to forms
                    </button>
                    <h2 style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 800 }}>
                      {selectedForm.name}
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                      {selectedForm.description || ""}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#4e6ef2",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Remote assessment
                  </span>
                </div>
                <ClinicalFormRenderer
                  form={selectedForm}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              </section>
            )}

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
                Your Assessment History
              </h2>
              <div style={{ display: "grid", gap: 12 }}>
                {submissions.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: 14 }}>
                    No submissions yet. Complete a form above to begin.
                  </p>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        border: "1px solid #f1f5f9",
                        borderRadius: 10,
                        background: "#f8fafc",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>
                          {sub.formDefinition.name}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          {sub.formDefinition.category} · Submitted{" "}
                          {new Date(sub.createdAt).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#16a34a",
                          textTransform: "uppercase",
                        }}
                      >
                        Recorded
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
