import { authHeaders } from "./session";

const API = "/api/v1";

export type ReviewQueueItem = {
  id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "REVIEWED" | "DRAFT";
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  formDefinition: { id: string; key: string; name: string; version: number };
  patient: { id: string; user: { firstName: string; lastName: string } };
  clinicalTask: { id: string; status: string; title: string } | null;
};

/** Clinician review queue: submitted questionnaires for assigned patients. */
export async function getReviewQueue(): Promise<{ submissions: ReviewQueueItem[] }> {
  const res = await fetch(`${API}/questionnaires/review-queue`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Sign in to access clinical review work.");
    if (res.status === 403) throw new Error("Your account is not authorised for clinical review.");
    throw new Error("Unable to load the review queue.");
  }
  return res.json();
}

/** Record a clinician review. Completes the generated task when marked reviewed. */
export async function reviewQuestionnaire(
  submissionId: string,
  notes: string,
): Promise<{ submissionId: string; status: string; nextOwner: string; nextAction: string }> {
  const res = await fetch(`${API}/questionnaires/submissions/${submissionId}/review`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Unable to record the review." }));
    throw new Error(body?.error?.message ?? body?.message ?? "Unable to record the review.");
  }
  return res.json();
}
