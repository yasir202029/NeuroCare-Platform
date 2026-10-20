const API = "/api/v1";
import { authHeaders } from "./session";

export type OpenAlert = {
  id: string;
  metric: string;
  severity: string;
  message: string;
  createdAt: string;
  reviewId: string;
  reviewDate: string;
  patientId: string;
  patientFirstName: string | null;
  patientLastName: string | null;
};

export type MonitoringAlertDetail = {
  id: string;
  metric: string;
  severity: string;
  message: string;
  acknowledgedAt: string | null;
};

export type MonitoringReview = {
  id: string;
  reviewDate: string;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  pulse: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  sleepHours: number | null;
  appetite: string | null;
  sideEffects: string | null;
  notes: string | null;
  alertCount: number;
  alerts: MonitoringAlertDetail[];
};

export type MonitoringHistory = {
  patientId: string;
  reviews: MonitoringReview[];
  totalCount: number;
};

export type RiskDomain =
  | "SELF_HARM"
  | "SUICIDE"
  | "RISK_TO_OTHERS"
  | "VULNERABILITY"
  | "SAFEGUARDING"
  | "EXPLOITATION"
  | "SUBSTANCE_USE"
  | "DOMESTIC_ABUSE";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RiskReviewStatus = "PENDING" | "IN_PROGRESS" | "ACTIONED";

export type RiskRecord = {
  id: string;
  domain: RiskDomain;
  currentRisk: RiskLevel;
  historicalRisk: RiskLevel | null;
  protectiveFactors: string | null;
  actions: string | null;
  notes: string | null;
  reviewedBy: string | null;
  reviewedByFirstName: string | null;
  reviewedByLastName: string | null;
  reviewedAt: string | null;
  reviewStatus: RiskReviewStatus;
};

export type NewRiskEntry = {
  domain: RiskDomain;
  currentRisk: RiskLevel;
  historicalRisk?: RiskLevel;
  protectiveFactors?: string;
  actions?: string;
  notes?: string;
};

async function unwrap<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) throw new Error("Sign in to access clinical monitoring work.");
    if (res.status === 403) throw new Error("Your account is not authorised for this patient.");
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? body?.message ?? fallback);
  }
  return res.json() as Promise<T>;
}

/** Unacknowledged physical-health alerts for patients assigned to the caller. */
export async function listOpenAlerts(): Promise<{ alerts: OpenAlert[]; totalCount: number }> {
  const res = await fetch(`${API}/monitoring/alerts`, { headers: authHeaders() });
  return unwrap(res, "Unable to load monitoring alerts.");
}

/** Acknowledge an alert. Idempotent on the backend. */
export async function acknowledgeAlert(alertId: string): Promise<{ id: string; patientId: string; acknowledgedAt: string; alreadyAcknowledged: boolean }> {
  const res = await fetch(`${API}/monitoring/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
    method: "POST",
    headers: authHeaders(),
  });
  return unwrap(res, "Unable to acknowledge the alert.");
}

/** Physical-health monitoring history for one patient (assignment-scoped). */
export async function getMonitoringHistory(patientId: string): Promise<MonitoringHistory> {
  const res = await fetch(`${API}/monitoring/monitoring/${encodeURIComponent(patientId)}`, {
    headers: authHeaders(),
  });
  return unwrap(res, "Unable to load monitoring history.");
}

/** Structured risk/safeguarding records for one patient (assignment-scoped). */
export async function getRiskRecords(patientId: string): Promise<RiskRecord[]> {
  const res = await fetch(`${API}/monitoring/risk/${encodeURIComponent(patientId)}`, {
    headers: authHeaders(),
  });
  return unwrap(res, "Unable to load risk records.");
}

/** Create a structured risk entry (clinical staff only, audited). */
export async function createRiskEntry(patientId: string, entry: NewRiskEntry): Promise<RiskRecord> {
  const res = await fetch(`${API}/monitoring/risk/${encodeURIComponent(patientId)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(entry),
  });
  return unwrap(res, "Unable to record the risk entry.");
}

/** Update a risk entry's review status (PENDING / IN_PROGRESS / ACTIONED). */
export async function updateRiskReviewStatus(
  patientId: string,
  entryId: string,
  reviewStatus: RiskReviewStatus,
): Promise<{ id: string; patientId: string; reviewStatus: RiskReviewStatus; reviewedAt: string; updatedAt: string }> {
  const res = await fetch(
    `${API}/monitoring/risk/${encodeURIComponent(patientId)}/${encodeURIComponent(entryId)}/review-status`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ reviewStatus }),
    },
  );
  return unwrap(res, "Unable to update the review status.");
}