"use client";

import { useEffect, useState, useCallback } from "react";
import { authenticatedFetch } from "../lib/client-api";

type FormField =
  | { id: string; type: "text" | "textarea" | "email"; label: string; required?: boolean; placeholder?: string }
  | { id: string; type: "number" | "scale"; label: string; min?: number; max?: number; required?: boolean; placeholder?: string }
  | { id: string; type: "select"; label: string; options: { label: string; value: string }[]; required?: boolean }
  | { id: string; type: "multiselect"; label: string; options: { label: string; value: string }[]; required?: boolean }
  | { id: string; type: "boolean"; label: string; required?: boolean }
  | { id: string; type: "date"; label: string; required?: boolean };

type FormSection = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
};

type ClinicalForm = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
  instrument?: string | null;
  fields: Record<string, unknown>;
  active: boolean;
};

type FormSubmission = {
  id: string;
  formDefinitionId: string;
  patientId: string;
  clinicianId?: string | null;
  answers: Record<string, unknown>;
  completedAt?: string | null;
  createdAt: string;
  formDefinition: { id: string; key: string; name: string; category: string };
  patient: { id: string; userId: string; user: { firstName: string; lastName: string; email: string } };
  clinician?: { id: string; firstName: string; lastName: string } | null;
};

interface ClinicalFormRendererProps {
  form: ClinicalForm | null;
  existingAnswers?: Record<string, unknown>;
  onSubmit?: (answers: Record<string, unknown>) => Promise<void>;
  submitting?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ClinicalFormRenderer({
  form,
  existingAnswers = {},
  onSubmit,
  submitting = false,
  readOnly = false,
  disabled = false,
  className,
}: ClinicalFormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    existingAnswers ?? {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const rawFields = form?.fields as Record<string, unknown> | undefined;
  const sections: FormSection[] = Array.isArray(rawFields?.sections)
    ? (rawFields.sections as FormSection[])
    : [];

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    let valid = true;
    for (const section of sections) {
      for (const field of section.fields) {
        if (!field.required) continue;
        const value = answers[field.id];
        const isEmpty =
          value === undefined || value === null || value === "" ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          next[field.id] = `${field.label} is required`;
          valid = false;
        }
      }
    }
    setErrors(next);
    return valid;
  }, [answers, sections]);

  useEffect(() => {
    if (existingAnswers && Object.keys(answers).length === 0) {
      setAnswers(existingAnswers);
    }
  }, [existingAnswers, answers]);

  function handleChange(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    if (!onSubmit) return;
    try {
      await onSubmit(answers);
      setSubmitted(true);
    } catch {
      // error handled by caller
    }
  }

  if (!form) {
    return (
      <div className={className} style={{ padding: 24, color: "#64748b" }}>
        No clinical form available.
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        className={className}
        style={{
          padding: 24,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          color: "#166534",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
          Form submitted successfully
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 14 }}>
          Your {form.name} responses have been recorded.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      style={{
        padding: 24,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        color: "#1e293b",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: -0.02,
          }}
        >
          {form.name}
        </h2>
        {form.description && (
          <p
            style={{
              margin: "0 0 20px",
              color: "#64748b",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {form.description}
          </p>
        )}
        {form.instrument && (
          <p
            style={{
              margin: "0 0 20px",
              color: "#4e6ef2",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Instrument: {form.instrument}
          </p>
        )}
      </div>

      {sections.map((section) => (
        <section
          key={section.id}
          style={{
            marginBottom: 28,
            paddingBottom: 20,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 18,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {section.title}
          </h3>
          {section.description && (
            <p
              style={{
                margin: "0 0 16px",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              {section.description}
            </p>
          )}
          <div style={{ display: "grid", gap: 14 }}>
            {section.fields.map((field) => {
              const error = errors[field.id];
              const value = answers[field.id];
              return (
                <div
                  key={field.id}
                  style={{
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {field.label}
                    {field.required && (
                      <span style={{ color: "#ef4444", fontWeight: 800 }}>
                        *
                      </span>
                    )}
                  </label>
                  {field.type === "text" || field.type === "email" || field.type === "textarea" ? (
                    field.type === "textarea" ? (
                      <textarea
                        value={String(value ?? "")}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        disabled={readOnly || disabled || submitting}
                        placeholder={field.placeholder}
                        rows={3}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${
                            error ? "#ef4444" : "#cbd5e1"
                          }`,
                          borderRadius: 8,
                          font: "inherit",
                          background: readOnly ? "#f8fafc" : "#ffffff",
                        }}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={String(value ?? "")}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        disabled={readOnly || disabled || submitting}
                        placeholder={field.placeholder}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${
                            error ? "#ef4444" : "#cbd5e1"
                          }`,
                          borderRadius: 8,
                          font: "inherit",
                          background: readOnly ? "#f8fafc" : "#ffffff",
                        }}
                      />
                    )
                  ) : field.type === "number" || field.type === "scale" ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={value === undefined || value === null ? "" : String(value)}
                        onChange={(e) =>
                          handleChange(field.id, Number(e.target.value))
                        }
                        disabled={readOnly || disabled || submitting}
                        placeholder={field.placeholder}
                        style={{
                          padding: "10px 12px",
                          border: `1px solid ${
                            error ? "#ef4444" : "#cbd5e1"
                          }`,
                          borderRadius: 8,
                          font: "inherit",
                          background: readOnly ? "#f8fafc" : "#ffffff",
                        }}
                      />
                      {field.type === "scale" && field.min !== undefined && field.max !== undefined && (
                        <div style={{ display: "flex", gap: 4 }}>
                          {[...Array(field.max - field.min + 1)].map((_, i) => {
                            const n = field.min! + i;
                            const selected = Number(value) === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => handleChange(field.id, n)}
                                disabled={readOnly || disabled || submitting}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: `1px solid ${
                                    selected ? "#4e6ef2" : "#cbd5e1"
                                  }`,
                                  background: selected ? "#4e6ef2" : "#ffffff",
                                  color: selected ? "#ffffff" : "#334155",
                                  fontWeight: selected ? 800 : 600,
                                  cursor: "pointer",
                                  font: "inherit",
                                }}
                              >
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : field.type === "select" || field.type === "multiselect" ? (
                    <select
                      multiple={field.type === "multiselect"}
                      value={
                        field.type === "multiselect"
                          ? ((value as string[]) ?? [])
                          : (String(value ?? "") as string)
                      }
                      onChange={(e) => {
                        if (field.type === "multiselect") {
                          const selected = Array.from(
                            e.target.selectedOptions,
                          ).map((o) => o.value);
                          handleChange(field.id, selected);
                        } else {
                          handleChange(field.id, e.target.value);
                        }
                      }}
                      disabled={readOnly || disabled || submitting}
                      style={{
                        padding: "10px 12px",
                        border: `1px solid ${
                          error ? "#ef4444" : "#cbd5e1"
                        }`,
                        borderRadius: 8,
                        font: "inherit",
                        background: readOnly ? "#f8fafc" : "#ffffff",
                      }}
                    >
                      <option value="">Select…</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) =>
                          handleChange(field.id, e.target.checked)
                        }
                        disabled={readOnly || disabled || submitting}
                        style={{
                          width: 16,
                          height: 16,
                          accentColor: "#4e6ef2",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#334155",
                          cursor: readOnly || disabled || submitting ? "not-allowed" : "pointer",
                        }}
                      >
                        {field.label}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={String(value ?? "")}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      disabled={readOnly || disabled || submitting}
                      style={{
                        padding: "10px 12px",
                        border: `1px solid ${
                          error ? "#ef4444" : "#cbd5e1"
                        }`,
                        borderRadius: 8,
                        font: "inherit",
                        background: readOnly ? "#f8fafc" : "#ffffff",
                      }}
                    />
                  )}
                  {error && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <button
          type="button"
          disabled={submitting}
          onClick={() => setAnswers({})}
          style={{
            padding: "10px 18px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            background: "#ffffff",
            color: "#334155",
            fontWeight: 700,
            cursor: "pointer",
            font: "inherit",
          }}
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 22px",
            border: "none",
            borderRadius: 8,
            background: "#4e6ef2",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
            font: "inherit",
          }}
        >
          {submitting ? "Saving…" : "Submit Clinical Form"}
        </button>
      </div>
    </form>
  );
}
