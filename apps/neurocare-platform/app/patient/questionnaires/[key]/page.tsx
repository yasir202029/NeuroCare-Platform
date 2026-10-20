"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PatientShell } from "../../../../components/patient-shell";
import {
  getQuestionnaires,
  saveDraft,
  submitQuestionnaire,
  type Questionnaire,
  type QuestionnaireField,
  type QuestionnaireFieldSpec,
} from "../../../../lib/questionnaire-api";

type Draft = Record<string, unknown>;

/**
 * Form definitions store fields as a record keyed by field id. Normalise both
 * the record shape and a plain array shape into one list.
 */
function coerceFields(raw: unknown): QuestionnaireField[] {
  if (Array.isArray(raw)) {
    return raw.map((field, index) => ({
      ...(field as QuestionnaireFieldSpec),
      key: (field as QuestionnaireField).key ?? String(index),
    }));
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { fields?: unknown }).fields)) {
    return ((raw as { fields: QuestionnaireField[] }).fields).map((field, index) => ({
      ...field,
      key: field.key ?? String(index),
    }));
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, QuestionnaireFieldSpec>).map(([key, spec]) => ({
      key,
      ...spec,
    }));
  }
  return [];
}

export default function QuestionnairePage() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const key = Array.isArray(params.key) ? params.key[0] : params.key;

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ nextAction?: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getQuestionnaires();
        const found = data.questionnaires.find((q) => q.key === key);
        if (!active) return;
        if (!found) {
          setError("That questionnaire is not available.");
          setLoading(false);
          return;
        }
        if (found.status !== "NOT_STARTED" && found.status !== "DRAFT") {
          setError(
            found.status === "REVIEWED"
              ? "This questionnaire has been reviewed. There is nothing for you to do here."
              : "This questionnaire has already been submitted. Your clinician will review it.",
          );
          setQuestionnaire(found);
          setLoading(false);
          return;
        }
        setQuestionnaire(found);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load this questionnaire.");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [key]);

  const fields = useMemo(() => coerceFields(questionnaire?.fields), [questionnaire]);

  const autosave = useCallback(async (next: Draft) => {
    if (!questionnaire) return;
    setSaveState("saving");
    try {
      await saveDraft(questionnaire.formDefinitionId, next);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [questionnaire]);

  const update = (name: string, value: unknown) => {
    setAnswers((prev) => {
      const next = { ...prev, [name]: value };
      void autosave(next);
      return next;
    });
  };

  const validate = (): string | null => {
    const missing = fields.find((field) => {
      if (!field.required) return false;
      const value = answers[field.key];
      return value === undefined || value === null || value === "";
    });
    if (missing) return `Please answer "${missing.label ?? missing.key}" before submitting.`;
    return null;
  };

  const submit = async () => {
    if (!questionnaire) return;
    const problem = validate();
    if (problem) {
      setValidationError(problem);
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    setSubmitError(null);
    try {
      let submissionId = questionnaire.submissionId;
      if (!submissionId) {
        const saved = await saveDraft(questionnaire.formDefinitionId, answers);
        submissionId = saved.submissionId;
      }
      const response = await submitQuestionnaire(submissionId);
      setResult({ nextAction: response.nextAction });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "We could not submit your questionnaire.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PatientShell>
        <h1 className="text-2xl font-semibold text-slate-900">Questionnaire</h1>
        <p className="mt-2 text-slate-600">Loading…</p>
      </PatientShell>
    );
  }

  if (result) {
    return (
      <PatientShell>
        <h1 className="text-2xl font-semibold text-slate-900">Questionnaire submitted</h1>
        <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-900">
            {result.nextAction ??
              "Your questionnaire has been submitted and is now with your clinician for review."}
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <Link
            href="/patient"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to your care
          </Link>
          <Link
            href="/patient/questionnaires"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Your other questionnaires
          </Link>
        </div>
      </PatientShell>
    );
  }

  if (error) {
    return (
      <PatientShell>
        <h1 className="text-2xl font-semibold text-slate-900">Questionnaire</h1>
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{error}</p>
        </div>
        <Link
          href="/patient/questionnaires"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to your questionnaires
        </Link>
      </PatientShell>
    );
  }

  if (!questionnaire) return null;

  return (
    <PatientShell>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/patient/questionnaires">My questionnaires</Link> <span aria-hidden="true">/</span>{" "}
        <span aria-current="page">{questionnaire.name}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{questionnaire.name}</h1>
      {questionnaire.description && <p className="mt-1 text-slate-600">{questionnaire.description}</p>}

      <p className="mt-2 text-xs text-slate-500" role="status" aria-live="polite">
        {saveState === "saving" && "Saving…"}
        {saveState === "saved" && "Answers saved"}
        {saveState === "error" && "We could not save your answers. Keep this page open and try again."}
        {saveState === "idle" && "Your answers save automatically as you type."}
      </p>

      {fields.length === 0 ? (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
          This questionnaire has no questions to answer yet. Please contact the team if you expected to
          complete something here.
        </p>
      ) : (
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {fields.map((field) => {
            const value = answers[field.key];
            const inputId = `field-${field.key}`;
            return (
              <div key={field.key} className="rounded-lg border border-slate-200 bg-white p-4">
                <label htmlFor={inputId} className="block text-sm font-semibold text-slate-900">
                  {field.label ?? field.key}
                  {field.required ? <span aria-hidden="true"> *</span> : null}
                  {field.required ? <span className="sr-only"> (required)</span> : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={inputId}
                    className="mt-2 w-full rounded border border-slate-300 p-2"
                    rows={4}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={inputId}
                    className="mt-2 w-full rounded border border-slate-300 p-2"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Choose…</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <select
                    id={inputId}
                    className="mt-2 w-full rounded border border-slate-300 p-2"
                    value={value === true ? "yes" : value === false ? "no" : ""}
                    onChange={(e) => update(field.key, e.target.value === "yes")}
                    required={field.required}
                  >
                    <option value="">Choose…</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : field.type === "number" ? (
                  <input
                    id={inputId}
                    type="number"
                    className="mt-2 w-full rounded border border-slate-300 p-2"
                    value={typeof value === "number" || typeof value === "string" ? String(value) : ""}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => update(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                    required={field.required}
                  />
                ) : (
                  <input
                    id={inputId}
                    type="text"
                    className="mt-2 w-full rounded border border-slate-300 p-2"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => update(field.key, e.target.value)}
                    required={field.required}
                  />
                )}
              </div>
            );
          })}

          {validationError && (
            <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {validationError}
            </p>
          )}
          {submitError && (
            <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {!reviewing ? (
              <button
                type="button"
                onClick={() => {
                  const problem = validate();
                  setValidationError(problem);
                  setReviewing(problem === null);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Review my answers
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit questionnaire"}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewing(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Keep editing
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </PatientShell>
  );
}
