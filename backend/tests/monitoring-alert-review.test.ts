import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role, RiskReviewStatus } from "@prisma/client";

/**
 * Service-level authorisation and idempotency tests for the clinician
 * monitoring/risk review surface.
 *
 * Prisma is mocked (the repository has no test-database harness), so these
 * assert the authorisation rules and the write behaviour of the services:
 * assignment scoping, tenant isolation, PATIENT exclusion, ADMIN exemption
 * and idempotent acknowledgement.
 */

const PATIENT_ID = "cpatient000000000000000001";
const OTHER_PATIENT_ID = "cpatient000000000000000002";
const CLINICIAN_USER_ID = "clin-user-1";
const ALERT_ID = "calert00000000000000000001";
const REVIEW_ID = "creview0000000000000000001";
const RISK_ENTRY_ID = "crisk000000000000000000001";
const ORG_ID = "corg0000000000000000000001";
const OTHER_ORG_ID = "corg0000000000000000000002";

const state = {
  assignments: [] as Array<{ patientId: string; userId: string; active: boolean }>,
  patients: [] as Array<{ id: string; userId: string; organizationId: string | null }>,
  memberships: [] as Array<{ userId: string; orgId: string }>,
  alerts: [] as any[],
  riskEntries: [] as any[],
  reviews: [] as any[],
};

vi.mock("../src/shared/db.js", () => {
  const prisma: any = {};
  prisma.patient = {
    findUnique: vi.fn(async ({ where }: any) => {
      const patient = state.patients.find((p) => p.id === where.id);
      if (!patient) return null;
      return { id: patient.id, userId: patient.userId, organizationId: patient.organizationId };
    }),
    findMany: vi.fn(async ({ where }: any) => {
      const ids: string[] = where.id?.in ?? [];
      const allowedOrgs: Array<string | null> = where.OR?.flatMap((clause: any) =>
        "organizationId" in clause && clause.organizationId
          ? clause.organizationId.in
          : [clause.organizationId],
      ) ?? [null];
      return state.patients
        .filter((p) => ids.includes(p.id) && allowedOrgs.includes(p.organizationId))
        .map((p) => ({ id: p.id }));
    }),
  };
  prisma.organizationMember = {
    findMany: vi.fn(async ({ where }: any) =>
      state.memberships
        .filter((m) => m.userId === where.userId)
        .map((m) => ({ orgId: m.orgId })),
    ),
  };
  prisma.patientAssignment = {
    findMany: vi.fn(async ({ where }: any) =>
      state.assignments
        .filter((a) => a.userId === where.userId && a.active === where.active)
        .map((a) => ({ patientId: a.patientId })),
    ),
    findFirst: vi.fn(async ({ where }: any) =>
      state.assignments.find(
        (a) =>
          a.patientId === where.patientId &&
          a.userId === where.userId &&
          a.active === where.active,
      ) ?? null,
    ),
  };
  prisma.physicalHealthAlert = {
    findMany: vi.fn(async ({ where }: any) => {
      const patientIds: string[] = where.review?.patientId?.in ?? [];
      return state.alerts
        .filter((alert) => alert.acknowledgedAt === where.acknowledgedAt)
        .filter((alert) => (patientIds.length ? patientIds.includes(alert.patientId) : true))
        .map((alert) => ({
          ...alert,
          review: {
            patientId: alert.patientId,
            reviewDate: alert.reviewDate,
            patient: {
              user: { firstName: alert.patientFirstName, lastName: alert.patientLastName },
            },
          },
        }));
    }),
    count: vi.fn(async ({ where }: any) => {
      const patientIds: string[] = where.review?.patientId?.in ?? [];
      return state.alerts
        .filter((alert) => alert.acknowledgedAt === where.acknowledgedAt)
        .filter((alert) => (patientIds.length ? patientIds.includes(alert.patientId) : true)).length;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const alert = state.alerts.find((a) => a.id === where.id);
      if (!alert) return null;
      return {
        ...alert,
        review: { patientId: alert.patientId, reviewDate: alert.reviewDate },
      };
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      const alert = state.alerts.find((a) => a.id === where.id);
      if (!alert || alert.acknowledgedAt !== null) return { count: 0 };
      Object.assign(alert, data);
      return { count: 1 };
    }),
  };
  prisma.physicalHealthReview = {
    findMany: vi.fn(async ({ where }: any) =>
      state.reviews
        .filter((review) => review.patientId === where.patientId)
        .map((review) => ({ ...review, alerts: [] })),
    ),
    count: vi.fn(async ({ where }: any) =>
      state.reviews.filter((review) => review.patientId === where.patientId).length,
    ),
  };
  prisma.clinicalRiskEntry = {
    findUnique: vi.fn(async ({ where }: any) => {
      const entry = state.riskEntries.find((e) => e.id === where.id);
      if (!entry) return null;
      return { id: entry.id, patientId: entry.patientId };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const entry = state.riskEntries.find((e) => e.id === where.id);
      if (!entry) throw new Error("Risk entry not found");
      Object.assign(entry, data, { updatedAt: new Date() });
      return entry;
    }),
  };
  return { prisma };
});

import {
  acknowledgeMonitoringAlert,
  getPatientMonitoringHistory,
  listOpenMonitoringAlerts,
} from "../src/services/monitoring.service.js";
import { updateRiskReviewStatus } from "../src/services/risk.service.js";
import { prisma } from "../src/shared/db.js";

const clinicianRoles = [Role.PSYCHIATRIST];
const adminRoles = [Role.ADMIN];
const patientRoles = [Role.PATIENT];

function seedPatient(
  id: string,
  organizationId: string | null = null,
  userId = "patient-user-1",
) {
  const patient = { id, userId, organizationId };
  state.patients.push(patient);
  return patient;
}

function seedAlert(overrides: Partial<(typeof state.alerts)[number]> = {}) {
  const alert = {
    id: ALERT_ID,
    reviewId: REVIEW_ID,
    patientId: PATIENT_ID,
    metric: "bloodPressureSystolic",
    severity: "CRITICAL",
    message: "bloodPressureSystolic value 200 is outside the safe range (90–180) and requires clinical review",
    acknowledgedAt: null as Date | null,
    createdAt: new Date("2026-10-01T09:00:00.000Z"),
    reviewDate: new Date("2026-10-01T09:00:00.000Z"),
    patientFirstName: "Ada",
    patientLastName: "Lovelace",
    ...overrides,
  };
  state.alerts.push(alert);
  return alert;
}

function seedRiskEntry(overrides: Partial<(typeof state.riskEntries)[number]> = {}) {
  const entry = {
    id: RISK_ENTRY_ID,
    patientId: PATIENT_ID,
    reviewStatus: RiskReviewStatus.PENDING,
    reviewedAt: null as Date | null,
    updatedAt: new Date("2026-10-01T09:00:00.000Z"),
    ...overrides,
  };
  state.riskEntries.push(entry);
  return entry;
}

beforeEach(() => {
  state.assignments = [];
  state.patients = [];
  state.memberships = [];
  state.alerts = [];
  state.riskEntries = [];
  state.reviews = [];
  vi.clearAllMocks();
});

describe("listOpenMonitoringAlerts", () => {
  it("returns only alerts for patients actively assigned to the clinician", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    seedAlert();

    const queue = await listOpenMonitoringAlerts(CLINICIAN_USER_ID, clinicianRoles);

    expect(queue.alerts).toHaveLength(1);
    expect(queue.alerts[0]).toMatchObject({
      id: ALERT_ID,
      patientId: PATIENT_ID,
      patientFirstName: "Ada",
      patientLastName: "Lovelace",
      severity: "CRITICAL",
    });
    expect(queue.totalCount).toBe(1);
    expect(prisma.physicalHealthAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          acknowledgedAt: null,
          review: { patientId: { in: [PATIENT_ID] } },
        }),
      }),
    );
  });

  it("returns an empty queue for a clinician with no active assignments", async () => {
    seedPatient(PATIENT_ID);
    seedAlert();

    const queue = await listOpenMonitoringAlerts(CLINICIAN_USER_ID, clinicianRoles);

    expect(queue.alerts).toEqual([]);
    expect(queue.totalCount).toBe(0);
    expect(prisma.physicalHealthAlert.findMany).not.toHaveBeenCalled();
  });

  it("excludes patients that belong to another organisation", async () => {
    seedPatient(PATIENT_ID, OTHER_ORG_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    state.memberships.push({ userId: CLINICIAN_USER_ID, orgId: ORG_ID });
    seedAlert();

    const queue = await listOpenMonitoringAlerts(CLINICIAN_USER_ID, clinicianRoles);

    expect(queue.alerts).toEqual([]);
    expect(queue.totalCount).toBe(0);
  });

  it("includes patients in the clinician's own organisation", async () => {
    seedPatient(PATIENT_ID, ORG_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    state.memberships.push({ userId: CLINICIAN_USER_ID, orgId: ORG_ID });
    seedAlert();

    const queue = await listOpenMonitoringAlerts(CLINICIAN_USER_ID, clinicianRoles);

    expect(queue.alerts).toHaveLength(1);
  });

  it("does not scope the queue to assignments for an admin", async () => {
    seedPatient(PATIENT_ID);
    seedAlert();

    const queue = await listOpenMonitoringAlerts("admin-user-1", adminRoles);

    expect(queue.alerts).toHaveLength(1);
    expect(prisma.patientAssignment.findMany).not.toHaveBeenCalled();
    expect(prisma.physicalHealthAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { acknowledgedAt: null } }),
    );
  });

  it("never exposes the queue to a patient", async () => {
    seedPatient(PATIENT_ID);
    seedAlert();

    const queue = await listOpenMonitoringAlerts("patient-user-1", patientRoles);

    expect(queue.alerts).toEqual([]);
    expect(prisma.physicalHealthAlert.findMany).not.toHaveBeenCalled();
  });
});

describe("acknowledgeMonitoringAlert", () => {
  it("refuses acknowledgement from a patient", async () => {
    seedPatient(PATIENT_ID);
    seedAlert();

    await expect(
      acknowledgeMonitoringAlert(ALERT_ID, "patient-user-1", patientRoles),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.physicalHealthAlert.updateMany).not.toHaveBeenCalled();
  });

  it("refuses acknowledgement from a clinician who is not assigned to the patient", async () => {
    seedPatient(PATIENT_ID);
    seedAlert();

    await expect(
      acknowledgeMonitoringAlert(ALERT_ID, CLINICIAN_USER_ID, clinicianRoles),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.physicalHealthAlert.updateMany).not.toHaveBeenCalled();
  });

  it("refuses acknowledgement across organisation boundaries", async () => {
    seedPatient(PATIENT_ID, OTHER_ORG_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    state.memberships.push({ userId: CLINICIAN_USER_ID, orgId: ORG_ID });
    seedAlert();

    await expect(
      acknowledgeMonitoringAlert(ALERT_ID, CLINICIAN_USER_ID, clinicianRoles),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.physicalHealthAlert.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an unknown alert", async () => {
    await expect(
      acknowledgeMonitoringAlert("missing-alert", CLINICIAN_USER_ID, clinicianRoles),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("acknowledges an alert for an assigned clinician", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    const alert = seedAlert();

    const result = await acknowledgeMonitoringAlert(ALERT_ID, CLINICIAN_USER_ID, clinicianRoles);

    expect(result.alreadyAcknowledged).toBe(false);
    expect(result.acknowledgedAt).toBeInstanceOf(Date);
    expect(alert.acknowledgedAt).toBeInstanceOf(Date);
    expect(prisma.physicalHealthAlert.updateMany).toHaveBeenCalledTimes(1);
  });

  it("is idempotent — a second acknowledgement does not write again", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    const acknowledgedAt = new Date("2026-10-02T10:00:00.000Z");
    seedAlert({ acknowledgedAt });

    const result = await acknowledgeMonitoringAlert(ALERT_ID, CLINICIAN_USER_ID, clinicianRoles);

    expect(result.alreadyAcknowledged).toBe(true);
    expect(result.acknowledgedAt).toEqual(acknowledgedAt);
    expect(prisma.physicalHealthAlert.updateMany).not.toHaveBeenCalled();
  });

  it("keeps the first acknowledgement when two calls race", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    const alert = seedAlert();
    const firstAcknowledgedAt = new Date("2026-10-02T10:00:00.000Z");

    // The conditional write loses the race: another actor acknowledged first.
    vi.mocked(prisma.physicalHealthAlert.updateMany).mockImplementationOnce(async () => {
      alert.acknowledgedAt = firstAcknowledgedAt;
      return { count: 0 };
    });

    const result = await acknowledgeMonitoringAlert(ALERT_ID, CLINICIAN_USER_ID, clinicianRoles);

    expect(result.alreadyAcknowledged).toBe(true);
    expect(result.acknowledgedAt).toEqual(firstAcknowledgedAt);
    expect(alert.acknowledgedAt).toEqual(firstAcknowledgedAt);
  });

  it("allows an admin to acknowledge an alert without an assignment", async () => {
    seedPatient(PATIENT_ID);
    seedAlert();

    const result = await acknowledgeMonitoringAlert(ALERT_ID, "admin-user-1", adminRoles);

    expect(result.alreadyAcknowledged).toBe(false);
    expect(prisma.patientAssignment.findFirst).not.toHaveBeenCalled();
  });
});

describe("getPatientMonitoringHistory", () => {
  it("returns the total number of readings, not just the page size", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    state.reviews.push({ id: REVIEW_ID, patientId: PATIENT_ID });

    const history = await getPatientMonitoringHistory(PATIENT_ID, CLINICIAN_USER_ID, clinicianRoles);

    expect(history.totalCount).toBe(1);
    expect(history.patientId).toBe(PATIENT_ID);
  });

  it("refuses readings for a patient in another organisation", async () => {
    seedPatient(PATIENT_ID, OTHER_ORG_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    state.memberships.push({ userId: CLINICIAN_USER_ID, orgId: ORG_ID });

    await expect(
      getPatientMonitoringHistory(PATIENT_ID, CLINICIAN_USER_ID, clinicianRoles),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("updateRiskReviewStatus", () => {
  it("refuses a review-status change from a patient", async () => {
    seedPatient(PATIENT_ID);
    seedRiskEntry();

    await expect(
      updateRiskReviewStatus(
        PATIENT_ID,
        RISK_ENTRY_ID,
        RiskReviewStatus.ACTIONED,
        "patient-user-1",
        patientRoles,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.clinicalRiskEntry.update).not.toHaveBeenCalled();
  });

  it("refuses a review-status change from an unassigned clinician", async () => {
    seedPatient(PATIENT_ID);
    seedRiskEntry();

    await expect(
      updateRiskReviewStatus(
        PATIENT_ID,
        RISK_ENTRY_ID,
        RiskReviewStatus.ACTIONED,
        CLINICIAN_USER_ID,
        clinicianRoles,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.clinicalRiskEntry.update).not.toHaveBeenCalled();
  });

  it("refuses a review-status change across organisation boundaries", async () => {
    seedPatient(PATIENT_ID, OTHER_ORG_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    state.memberships.push({ userId: CLINICIAN_USER_ID, orgId: ORG_ID });
    seedRiskEntry();

    await expect(
      updateRiskReviewStatus(
        PATIENT_ID,
        RISK_ENTRY_ID,
        RiskReviewStatus.ACTIONED,
        CLINICIAN_USER_ID,
        clinicianRoles,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.clinicalRiskEntry.update).not.toHaveBeenCalled();
  });

  it("refuses a review-status change for an entry belonging to another patient", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    seedRiskEntry({ patientId: OTHER_PATIENT_ID });

    await expect(
      updateRiskReviewStatus(
        PATIENT_ID,
        RISK_ENTRY_ID,
        RiskReviewStatus.ACTIONED,
        CLINICIAN_USER_ID,
        clinicianRoles,
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.clinicalRiskEntry.update).not.toHaveBeenCalled();
  });

  it("records the review status for an assigned clinician", async () => {
    seedPatient(PATIENT_ID);
    state.assignments.push({ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true });
    const entry = seedRiskEntry();

    const result = await updateRiskReviewStatus(
      PATIENT_ID,
      RISK_ENTRY_ID,
      RiskReviewStatus.IN_PROGRESS,
      CLINICIAN_USER_ID,
      clinicianRoles,
    );

    expect(result.reviewStatus).toBe(RiskReviewStatus.IN_PROGRESS);
    expect(entry.reviewStatus).toBe(RiskReviewStatus.IN_PROGRESS);
    expect(entry.reviewedAt).toBeInstanceOf(Date);
  });

  it("allows an admin to update the review status without an assignment", async () => {
    seedPatient(PATIENT_ID);
    seedRiskEntry();

    const result = await updateRiskReviewStatus(
      PATIENT_ID,
      RISK_ENTRY_ID,
      RiskReviewStatus.ACTIONED,
      "admin-user-1",
      adminRoles,
    );

    expect(result.reviewStatus).toBe(RiskReviewStatus.ACTIONED);
    expect(prisma.patientAssignment.findFirst).not.toHaveBeenCalled();
  });
});
