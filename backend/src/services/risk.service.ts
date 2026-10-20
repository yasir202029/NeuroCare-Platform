import { RiskDomain, RiskLevel, RiskReviewStatus, Role } from "@prisma/client";
import { prisma } from "../shared/db.js";
import { badRequest, forbidden, notFound } from "../shared/errors.js";
import { assertPatientAccess } from "./patient-authz.service.js";

/**
 * Roles that may author or amend structured clinical risk data. Mirrors
 * `clinicalStaffRoles` in the auth middleware.
 */
const CLINICAL_ROLES: Role[] = [
  Role.ADMIN,
  Role.PSYCHIATRIST,
  Role.PRESCRIBER,
  Role.NURSE,
];

const isClinical = (roles: Role[]) => roles.some((role) => CLINICAL_ROLES.includes(role));

/**
 * Structured clinical risk/safeguarding domains.
 *
 * These are deterministic structured fields, NOT AI-generated risk scores.
 */
export const RISK_DOMAINS = [
  RiskDomain.SELF_HARM,
  RiskDomain.SUICIDE,
  RiskDomain.RISK_TO_OTHERS,
  RiskDomain.VULNERABILITY,
  RiskDomain.SAFEGUARDING,
  RiskDomain.EXPLOITATION,
  RiskDomain.SUBSTANCE_USE,
  RiskDomain.DOMESTIC_ABUSE,
] as const;

export type { RiskDomain };

/**
 * Structured risk entry with current and historical data.
 */
export type RiskEntryInput = {
  patientId: string;
  domain: RiskDomain;
  currentRisk: RiskLevel;
  historicalRisk?: RiskLevel;
  protectiveFactors?: string | null;
  actions?: string | null;
  notes?: string | null;
  clinicianId?: string;
  reviewedBy?: string;
  reviewStatus?: RiskReviewStatus;
};

/**
 * Create a structured risk entry.
 *
 * Permissions:
 * - PATIENT may never create risk entries (reads only).
 * - Clinical staff must be actively assigned to the patient; ADMIN is exempt.
 */
export async function createRiskEntry(input: RiskEntryInput) {
  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    select: { id: true },
  });
  if (!patient) {
    throw badRequest("Patient not found");
  }

  const authorId = input.clinicianId ?? input.reviewedBy;
  if (!authorId) {
    throw badRequest("clinicianId is required");
  }

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { roles: true },
  });
  if (!author) {
    throw badRequest("Clinician not found");
  }

  // Patient can never record structured risk data.
  if (!isClinical(author.roles)) {
    throw forbidden("You cannot record structured risk data");
  }

  // Clinical staff must be actively assigned to the patient and share its
  // organisation; ADMIN is exempt.
  await assertPatientAccess(authorId, author.roles, input.patientId);

  const record = await prisma.clinicalRiskEntry.create({
    data: {
      patientId: input.patientId,
      clinicianId: authorId,
      domain: input.domain,
      currentRisk: input.currentRisk,
      historicalRisk: input.historicalRisk,
      protectiveFactors: input.protectiveFactors ?? null,
      actions: input.actions ?? null,
      notes: input.notes ?? null,
      reviewedAt: new Date(),
      reviewStatus: input.reviewStatus ?? RiskReviewStatus.PENDING,
    },
    include: {
      patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      clinician: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return {
    id: record.id,
    patientId: record.patientId,
    domain: record.domain,
    currentRisk: record.currentRisk,
    historicalRisk: record.historicalRisk,
    protectiveFactors: record.protectiveFactors,
    actions: record.actions,
    notes: record.notes,
    reviewedBy: record.clinician?.id ?? null,
    reviewedByFirstName: record.clinician?.firstName ?? null,
    reviewedByLastName: record.clinician?.lastName ?? null,
    reviewedAt: record.reviewedAt,
    reviewStatus: record.reviewStatus,
    patient: record.patient,
    clinician: record.clinician,
  };
}

/**
 * Get risk/safeguarding records for a patient.
 * PATIENT sees only their own records. Clinicians see their assigned patients.
 */
export async function getPatientRiskRecords(
  patientId: string,
  userId: string,
  roles: Role[],
) {
  // Shared isolation rules: ownership for patients, active assignment for
  // clinical staff, organisation scoping, and an ADMIN bypass.
  await assertPatientAccess(userId, roles, patientId);

  const records = await prisma.clinicalRiskEntry.findMany({
    where: { patientId },
    orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
    include: {
      patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      clinician: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return records.map((r) => ({
    id: r.id,
    domain: r.domain,
    currentRisk: r.currentRisk,
    historicalRisk: r.historicalRisk,
    protectiveFactors: r.protectiveFactors,
    actions: r.actions,
    notes: r.notes,
    reviewedBy: r.clinician?.id ?? null,
    reviewedByFirstName: r.clinician?.firstName ?? null,
    reviewedByLastName: r.clinician?.lastName ?? null,
    reviewedAt: r.reviewedAt,
    reviewStatus: r.reviewStatus,
    patient: r.patient,
  }));
}

/**
 * Update the review status of a structured risk entry.
 *
 * A review may be moved between PENDING, IN_PROGRESS and ACTIONED, including
 * re-opening a completed review; every change is recorded in the audit trail
 * and `reviewedAt` tracks the most recent review activity.
 *
 * Authorization: PATIENT may never update risk reviews; clinical staff must
 * be actively assigned and share the patient's organisation; ADMIN is exempt.
 * The entry must belong to the stated patient.
 */
export async function updateRiskReviewStatus(
  patientId: string,
  entryId: string,
  reviewStatus: RiskReviewStatus,
  userId: string,
  roles: Role[],
) {
  if (!isClinical(roles)) {
    throw forbidden("You cannot update clinical risk reviews");
  }
  // Shared isolation rules: active assignment for clinical staff, organisation
  // scoping, and an ADMIN bypass.
  await assertPatientAccess(userId, roles, patientId);

  const entry = await prisma.clinicalRiskEntry.findUnique({
    where: { id: entryId },
    select: { id: true, patientId: true },
  });
  if (!entry || entry.patientId !== patientId) {
    throw notFound("Risk entry not found");
  }

  const updated = await prisma.clinicalRiskEntry.update({
    where: { id: entry.id },
    data: { reviewStatus, reviewedAt: new Date() },
    select: { id: true, patientId: true, reviewStatus: true, reviewedAt: true, updatedAt: true },
  });

  return {
    id: updated.id,
    patientId: updated.patientId,
    reviewStatus: updated.reviewStatus,
    reviewedAt: updated.reviewedAt,
    updatedAt: updated.updatedAt,
  };
}
