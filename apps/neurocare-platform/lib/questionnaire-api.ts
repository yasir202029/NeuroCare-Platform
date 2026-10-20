import { authenticatedFetch } from "./client-api";

const API = "/api/v1";

export type QuestionnaireStatus = "NOT_STARTED" | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "REVIEWED";

export type QuestionnaireFieldSpec = {
  label?: string;
  type?: "text" | "textarea" | "number" | "select" | "boolean" | "scale";
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
};

export type QuestionnaireField = QuestionnaireFieldSpec & { key: string };

export type Questionnaire = {
  formDefinitionId: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  category: string;
  instrument: string | null;
  fields: unknown;
  status: QuestionnaireStatus;
  submissionId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string | null;
};

export type QuestionnaireList = {
  patientId: string;
  questionnaires: Questionnaire[];
};

export type SubmissionResult = {
  submissionId: string;
  status: string;
  submittedAt?: string | null;
  nextOwner?: string;
  nextAction?: string;
};

/** The patient's own questionnaires with real submission status. */
export async function getQuestionnaires(): Promise<QuestionnaireList> {
  const res = await authenticatedFetch(`${API}/questionnaires/assigned`);
  if (!res.ok) throw new Error("Failed to load your questionnaires");
  return res.json();
}

/** Autosave a draft. Safe to call repeatedly. */
export async function saveDraft(formDefinitionId: string, answers: Record<string, unknown>): Promise<{ submissionId: string; status: string }> {
  const res = await authenticatedFetch(`${API}/questionnaires/submissions/${formDefinitionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to save your answers" }));
    throw new Error(err.message ?? "Failed to save your answers");
  }
  return res.json();
}

/** Finalise a draft. This creates the clinician review task. */
export async function submitQuestionnaire(submissionId: string): Promise<SubmissionResult> {
  const res = await authenticatedFetch(`${API}/questionnaires/submissions/${submissionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to submit your questionnaire" }));
    throw new Error(err.message ?? "Failed to submit your questionnaire");
  }
  return res.json();
}
