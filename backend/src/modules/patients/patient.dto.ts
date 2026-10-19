import { z } from "zod";

/**
 * Patient-facing DTO. Excludes internal/sensitive fields:
 * nhsNumberCipher, nhsNumberHash, audit metadata, deletion metadata,
 * organisation-internal config, staff assignments, internal clinical notes,
 * safeguarding, AI drafts, internal billing adjustments.
 */
export const PatientProfileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateOfBirth: z.string().nullable(),
  sexAtBirth: z.string().nullable(),
  gender: z.string().nullable(),
  address: z.record(z.string(), z.string()).nullable(),
  emergencyContact: z.record(z.string(), z.string()).nullable(),
  preferredContact: z.string().nullable(),
  consentToContact: z.boolean(),
  medicalHistory: z.string().nullable(),
  currentMedication: z.array(z.record(z.string(), z.string())).nullable(),
  accessibilityNeeds: z.string().nullable(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
  }),
});

export type PatientProfileResponse = z.infer<typeof PatientProfileResponseSchema>;

export function toPatientProfileDTO(patient: {
  id: string;
  userId: string;
  dateOfBirth: Date | null;
  sexAtBirth: string | null;
  gender: string | null;
  address: unknown;
  emergencyContact: unknown;
  preferredContact: string | null;
  consentToContact: boolean;
  medicalHistory: string | null;
  currentMedication: unknown;
  accessibilityNeeds: string | null;
  user: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
}): PatientProfileResponse {
  return {
    id: patient.id,
    userId: patient.userId,
    dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : null,
    sexAtBirth: patient.sexAtBirth,
    gender: patient.gender,
    address: (patient.address as Record<string, string> | null) ?? null,
    emergencyContact: (patient.emergencyContact as Record<string, string> | null) ?? null,
    preferredContact: patient.preferredContact,
    consentToContact: patient.consentToContact,
    medicalHistory: patient.medicalHistory,
    currentMedication: (patient.currentMedication as Record<string, string>[] | null) ?? null,
    accessibilityNeeds: patient.accessibilityNeeds,
    user: patient.user,
  };
}
