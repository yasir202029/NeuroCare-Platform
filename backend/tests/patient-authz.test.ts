import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Role } from "@prisma/client";

vi.mock("../src/shared/db.js", () => {
  const pf = vi.fn();
  const pa = vi.fn();
  return {
    prisma: { patient: { findUnique: pf }, patientAssignment: { findFirst: pa } },
    __pf: pf,
    __pa: pa,
  };
});

import { assertPatientAccess, resolvePatientId } from "../src/services/patient-authz.service.js";
import { __pf as patientFindUnique, __pa as patientAssignmentFindFirst } from "../src/shared/db.js";

const patientId = "patient-1";
const otherPatientId = "patient-2";
const userId = "user-1";
const clinicianUserId = "clinician-1";

function mockPatient(found: boolean, pid: string = patientId, uid: string = userId) {
  patientFindUnique.mockImplementation(({ where }: { where: { id?: string; userId?: string } }) => {
    if (!found) return Promise.resolve(null);
    if (where.id !== undefined) {
      if (where.id === pid) return Promise.resolve({ id: pid, userId: uid });
      return Promise.resolve({ id: where.id, userId: "other-user" });
    }
    if (where.userId === uid) return Promise.resolve({ id: pid, userId: uid });
    return Promise.resolve(null);
  });
}

function mockAssignment(found: boolean) {
  patientAssignmentFindFirst.mockResolvedValue(found ? { id: "assignment-1" } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("resolvePatientId", () => {
  it("returns the patient record when the user has a linked profile", async () => {
    mockPatient(true);
    const result = await resolvePatientId(userId);
    expect(result).toEqual({ id: patientId, userId });
    expect(patientFindUnique).toHaveBeenCalledWith({
      where: { userId },
      select: { id: true, userId: true },
    });
  });

  it("returns null when the user has no linked patient profile", async () => {
    mockPatient(false);
    const result = await resolvePatientId(userId);
    expect(result).toBeNull();
  });
});

describe("assertPatientAccess — PATIENT role", () => {
  it("allows a patient to access their own record", async () => {
    mockPatient(true);
    await expect(
      assertPatientAccess(userId, [Role.PATIENT], patientId),
    ).resolves.toBeUndefined();
  });

  it("blocks a patient from accessing another patient's record (IDOR)", async () => {
    mockPatient(true, patientId, userId);
    await expect(
      assertPatientAccess(userId, [Role.PATIENT], otherPatientId),
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  it("blocks a patient when no profile exists", async () => {
    mockPatient(false);
    await expect(
      assertPatientAccess(userId, [Role.PATIENT], patientId),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("blocks a non-patient, non-staff role from accessing any patient", async () => {
    mockPatient(true);
    await expect(
      assertPatientAccess(userId, [Role.FINANCE], patientId),
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });
});

describe("assertPatientAccess — clinical staff", () => {
  it("allows assigned clinical staff to access their patient", async () => {
    mockPatient(true);
    mockAssignment(true);
    await expect(
      assertPatientAccess(clinicianUserId, [Role.NURSE], patientId),
    ).resolves.toBeUndefined();
    expect(patientAssignmentFindFirst).toHaveBeenCalledWith({
      where: { patientId, userId: clinicianUserId, active: true },
      select: { id: true },
    });
  });

  it("blocks clinical staff not assigned to the patient", async () => {
    mockPatient(true);
    mockAssignment(false);
    await expect(
      assertPatientAccess(clinicianUserId, [Role.NURSE], patientId),
    ).rejects.toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  it("blocks clinical staff when the patient does not exist", async () => {
    mockPatient(false);
    mockAssignment(false);
    await expect(
      assertPatientAccess(clinicianUserId, [Role.NURSE], patientId),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });
});

describe("assertPatientAccess — ADMIN", () => {
  it("allows admin to access any patient", async () => {
    mockPatient(true);
    await expect(
      assertPatientAccess(userId, [Role.ADMIN], otherPatientId),
    ).resolves.toBeUndefined();
    expect(patientAssignmentFindFirst).not.toHaveBeenCalled();
  });

  it("still returns 404 for admin when the patient does not exist", async () => {
    mockPatient(false);
    await expect(
      assertPatientAccess(userId, [Role.ADMIN], patientId),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });
});
