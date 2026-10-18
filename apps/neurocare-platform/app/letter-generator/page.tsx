"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authenticatedFetch } from "../../lib/client-api";

type Patient = {
  id: string;
  user: { firstName: string; lastName: string; email: string };
};

type LetterDraft = {
  letter: {
    type: string;
    title: string;
    content: string;
    recipient: string;
    disclaimer: string;
  };
  documentId: string;
  model: string;
};

export default function LetterGeneratorPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [result, setResult] = useState<LetterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    patientId: string;
    type: string;
    recipient: string;
    clinicalContext: string;
    templateKey: string;
  }>({
    patientId: "",
    type: "GP_LETTER",
    recipient: "",
    clinicalContext: "",
    templateKey: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      authenticatedFetch("/api/v1/patients?take=50"),
      authenticatedFetch("/api/v1/ai/templates"),
    ])
      .then(async ([pRes, tRes]) => {
        if (!active) return;
        if (pRes.ok) {
          const data = await pRes.json();
          setPatients((data as any).patients ?? (data as any) ?? []);
        }
        if (tRes.ok) {
          setTemplates(await tRes.json());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function generateLetter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await authenticatedFetch("/api/v1/ai/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId,
          type: form.type,
          recipient: form.recipient,
          clinicalContext: form.clinicalContext,
          templateKey: form.templateKey || undefined,
        }),
      });
      if (!res.ok) throw new Error("Letter generation failed");
      const data = await res.json();
      setResult(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Letter generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        color: "#0f172a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "24px clamp(20px, 5vw, 64px) 56px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <Link href="/clinician" style={{ textDecoration: "none", fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
            NEUROCARE
          </Link>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 }}>
            AI Letter Generator · ADHD EHR
          </p>
        </div>
        <Link
          href="/clinician"
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
          ← Back to Clinic
        </Link>
      </header>

      <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 12px", letterSpacing: -0.02 }}>
        AI Clinical Letter Generator
      </h1>
      <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.6, marginBottom: 32, maxWidth: 800 }}>
        AI-assisted clinical correspondence for UK NHS and private ADHD clinics.
        Generate GP letters, shared care letters, assessment reports, and referral letters.
        All letters require clinician review and signature before sending.
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

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
          Generate Letter
        </h2>
        <form onSubmit={generateLetter} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Patient
            <select
              required
              value={form.patientId}
              onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.firstName} {p.user.lastName}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Letter Type
            <select
              required
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            >
              <option value="GP_LETTER">GP Letter</option>
              <option value="SHARED_CARE_LETTER">Shared Care Letter</option>
              <option value="ASSESSMENT_REPORT">Assessment Report</option>
              <option value="REFERRAL_LETTER">Referral Letter</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Recipient
            <input
              required
              value={form.recipient}
              onChange={(e) => setForm((prev) => ({ ...prev, recipient: e.target.value }))}
              placeholder="e.g. Dr. Sarah Smith, GP Practice"
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
            Clinical Context
            <textarea
              required
              value={form.clinicalContext}
              onChange={(e) => setForm((prev) => ({ ...prev, clinicalContext: e.target.value }))}
              rows={5}
              placeholder="Summarise the patient's condition, assessment findings, medications, and requested action..."
              style={{
                padding: "10px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                font: "inherit",
                width: "100%",
                boxSizing: "border-box" as const,
              }}
            />
          </label>
          {templates.length > 0 && (
            <label style={{ display: "grid", gap: 6, fontWeight: 700, fontSize: 13, color: "#334155" }}>
              Template (optional)
              <select
                value={form.templateKey}
                onChange={(e) => setForm((prev) => ({ ...prev, templateKey: e.target.value }))}
                style={{
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  font: "inherit",
                  width: "100%",
                  boxSizing: "border-box" as const,
                }}
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button disabled={busy} style={{
            background: "#4e6ef2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 22px",
            fontWeight: 800,
            cursor: "pointer",
            font: "inherit",
          }}>
            {busy ? "Generating…" : "Generate Letter"}
          </button>
        </form>
      </section>

      {result && (
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
            Generated Letter
          </h2>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 800, color: "#4e6ef2", marginBottom: 12 }}>
            AI Model: {result.model} · Document ID: {result.documentId}
          </div>
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 20,
              background: "#f8fafc",
              fontFamily: "Georgia, serif",
              lineHeight: 1.7,
              color: "#1e293b",
              whiteSpace: "pre-wrap",
              fontSize: 14,
            }}
          >
            {result.letter.content}
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "#fef3c7",
              color: "#92400e",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            <strong>Disclaimer:</strong> {result.letter.disclaimer}
          </div>
        </section>
      )}
    </div>
  );
}
