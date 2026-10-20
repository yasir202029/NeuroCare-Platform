import { authenticatedFetch } from "./client-api";

const API = "/api/v1";

export type PatientNextAction = {
  type: string;
  title: string;
  description: string;
  actionUrl: string;
  blocking: boolean;
};

export type PatientJourney = {
  currentStage: string;
  patientVisibleStatus: string;
  nextAction: PatientNextAction;
  secondaryActions: PatientNextAction[];
  milestones: Array<{ key: string; label: string; state: "DONE" | "CURRENT" | "PENDING" | "BLOCKED" }>;
  upcoming: Array<{ id: string; type: string; mode: string; startsAt: string; status: string }>;
  outstanding: Array<{ id: string; title: string; type: string; dueAt: string | null }>;
  outstandingQuestionnaires: Array<{ submissionId: string; name: string; status: string }>;
  outstandingDocumentRequests: Array<{
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    status: string;
  }>;
  recentUpdates: Array<{ id: string; title: string; type: string; createdAt: string }>;
};

/** Fetch the patient journey projection (next action, milestones, upcoming, updates). */
export async function getPatientJourney(): Promise<PatientJourney> {
  const res = await authenticatedFetch(`${API}/portals/patient/next-action`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to load your care journey" }));
    throw new Error(err.message ?? "Failed to load your care journey");
  }
  return res.json();
}
