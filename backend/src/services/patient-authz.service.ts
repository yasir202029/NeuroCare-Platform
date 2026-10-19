import { Role } from "@prisma/client";
import { prisma } from "../shared/db.js";
import { forbidden, notFound } from "../shared/errors.js";

const clinicalRoles: Role[] = [
  Role.ADMIN,
  Role.PSYCHIATRIST,
  Role.PRESCRIBER,
  Role.NURSE,
];

/**
 * Resolves the Patient record belonging to the given user.
 * Returns null when the user has no linked patient profile.
 */
export async function resolvePatientId(userId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });
  return patient;
}

/**
 * Asserts that the actor (identified by userId + roles) may access the given patient.
 *
 * Access rules:
 * - ADMIN: access to every patient.
 * - PATIENT: access only to their own linked patient record (userId must match).
 * - Clinical staff (PSYCHIATRIST, PRESCRIBER, NURSE): access to patients they are
 *   actively assigned to via PatientAssignment, plus every patient when ADMIN is also held.
 *
 * Throws forbidden() when access is denied, notFound() when the patient does not exist.
 */
export async function assertPatientAccess(
  userId: string,
  roles: Role[],
  patientId: string,
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, userId: true },
  });
  if (!patient) throw notFound("Patient not found");

  if (roles.includes(Role.ADMIN)) return;

  // Patients may only access their own record.
  if (roles.includes(Role.PATIENT) && !roles.some((r) => clinicalRoles.includes(r))) {
    if (patient.userId === userId) return;
    throw forbidden("Patients may only access their own records.");
  }

  // Clinical staff must be actively assigned to the patient.
  const assignment = await prisma.patientAssignment.findFirst({
    where: { patientId, userId, active: true },
    select: { id: true },
  });
  if (assignment) return;

  throw forbidden("You are not assigned to this patient.");
}

/**
 * Returns the set of patient IDs the actor may access.
 * ADMIN and clinical staff without assignments receive an empty set (caller must
 * handle the "all patients" case separately based on role policy).
 */
export async function accessiblePatientIds(userId: string, roles: Role[]) {
  if (roles.includes(Role.ADMIN)) return null; // null signals "all patients"
  if (roles.includes(Role.PATIENT) && !roles.some((r) => clinicalRoles.includes(r))) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    return patient ? new Set([patient.id]) : new Set<string>();
  }
  const assignments = await prisma.patientAssignment.findMany({
    where: { userId, active: true },
    select: { patientId: true },
  });
  return new Set(assignments.map((a) => a.patientId));
}
