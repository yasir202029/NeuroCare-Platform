import { authenticatedFetch } from "./client-api";

const API = "/api/v1";

export type PatientProfile = {
  id: string;
  userId: string;
  nhsNumberCipher: string | null;
  nhsNumberHash: string | null;
  dateOfBirth: string | null;
  sexAtBirth: string | null;
  gender: string | null;
  address: Record<string, unknown> | null;
  emergencyContact: Record<string, unknown> | null;
  preferredContact: string | null;
  consentToContact: boolean;
  medicalHistory: string | null;
  currentMedication: Record<string, unknown>[] | null;
  accessibilityNeeds: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
};

export type UpdatePatientProfileInput = {
  nhsNumber?: string;
  dateOfBirth?: string;
  sexAtBirth?: string;
  gender?: string;
  address?: Record<string, unknown>;
  emergencyContact?: Record<string, unknown>;
  preferredContact?: string;
  consentToContact?: boolean;
  medicalHistory?: string;
  currentMedication?: Record<string, unknown>[];
  accessibilityNeeds?: string;
};

/** Fetch the authenticated patient's own profile. */
export async function getPatientProfile(): Promise<PatientProfile> {
  const res = await authenticatedFetch(`${API}/patients/me`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to load patient profile" }));
    throw new Error(err.message ?? "Failed to load patient profile");
  }
  return res.json();
}

/** Update the authenticated patient's own profile. */
export async function updatePatientProfile(input: UpdatePatientProfileInput): Promise<PatientProfile> {
  const res = await authenticatedFetch(`${API}/patients/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to update patient profile" }));
    throw new Error(err.message ?? "Failed to update patient profile");
  }
  return res.json();
}

/** Fetch clinical notes for a patient (clinical staff only, requires assignment). */
export async function getPatientClinicalNotes(patientId: string) {
  const res = await authenticatedFetch(`${API}/clinical-notes/patient/${encodeURIComponent(patientId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to load clinical notes" }));
    throw new Error(err.message ?? "Failed to load clinical notes");
  }
  return res.json();
}
