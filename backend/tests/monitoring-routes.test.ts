import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Route-level contract tests for the monitoring module.
 *
 * These exercise the request validation that sits in front of the services:
 * unknown body fields must be rejected rather than silently dropped, and
 * identifiers must be well-formed before they reach the data layer.
 */

const PATIENT_ID = "cpatient000000000000000001";
const ENTRY_ID = "crisk000000000000000000001";
const ALERT_ID = "calert00000000000000000001";
const CLINICIAN_USER_ID = "clin-user-1";

const state = {
  assignments: [] as Array<{ patientId: string; userId: string; active: boolean }>,
  patients: [] as Array<{ id: string; userId: string; organizationId: string | null }>,
  riskEntries: [] as any[],
  alerts: [] as any[],
  updated: [] as any[],
};

vi.mock("../src/shared/db.js", () => {
  const prisma: any = {};
  prisma.patient = {
    findUnique: vi.fn(async ({ where }: any) => {
      const patient = state.patients.find((p) => p.id === where.id);
      if (!patient) return null;
      return { id: patient.id, userId: patient.userId, organizationId: patient.organizationId };
    }),
    findMany: vi.fn(async () => state.patients.map((p) => ({ id: p.id }))),
  };
  prisma.organizationMember = { findMany: vi.fn(async () => []) };
  prisma.patientAssignment = {
    findFirst: vi.fn(async ({ where }: any) =>
      state.assignments.find(
        (a) =>
          a.patientId === where.patientId &&
          a.userId === where.userId &&
          a.active === where.active,
      ) ?? null,
    ),
    findMany: vi.fn(async () => state.assignments.map((a) => ({ patientId: a.patientId }))),
  };
  prisma.clinicalRiskEntry = {
    findUnique: vi.fn(async ({ where }: any) => {
      const entry = state.riskEntries.find((e) => e.id === where.id);
      return entry ? { id: entry.id, patientId: entry.patientId } : null;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const entry = state.riskEntries.find((e) => e.id === where.id);
      if (!entry) throw new Error("Risk entry not found");
      Object.assign(entry, data, { updatedAt: new Date() });
      state.updated.push({ id: entry.id, data });
      return entry;
    }),
  };
  prisma.physicalHealthAlert = {
    findUnique: vi.fn(async ({ where }: any) => {
      const alert = state.alerts.find((a) => a.id === where.id);
      if (!alert) return null;
      return { ...alert, review: { patientId: alert.patientId, reviewDate: new Date() } };
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      const alert = state.alerts.find((a) => a.id === where.id);
      if (!alert || alert.acknowledgedAt !== null) return { count: 0 };
      Object.assign(alert, data);
      return { count: 1 };
    }),
  };
  prisma.auditEvent = { create: vi.fn(async () => ({})) };
  prisma.user = { findUnique: vi.fn(async () => ({ roles: [Role.PSYCHIATRIST] })) };
  prisma.clinicalRiskEntry.create = vi.fn(async ({ data }: any) => ({
    id: ENTRY_ID,
    ...data,
    patient: { id: PATIENT_ID, user: { firstName: "Ada", lastName: "Lovelace" } },
    clinician: { id: CLINICIAN_USER_ID, firstName: "Priya", lastName: "Psychiatrist" },
  }));
  return { prisma };
});

import router from "../src/modules/monitoring/monitoring.routes.js";

type Handler = (req: any, res: any, next: any) => any;

function routeFor(method: string, path: string): Handler {
  const layer = (router as any).stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method] === true,
  );
  if (!layer) throw new Error(`Route ${method} ${path} not found`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

async function run(method: string, path: string, req: any) {
  const handler = routeFor(method, path);
  let error: any = null;
  const res = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.payload = payload;
      return this;
    },
  };
  handler(req, res, (e: any) => {
    error = e;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { res, error };
}

const clinician = { id: CLINICIAN_USER_ID, roles: [Role.PSYCHIATRIST] };

const req = (overrides: any) => ({
  user: clinician,
  params: {},
  query: {},
  body: {},
  requestId: "req-1",
  method: "PATCH",
  path: "/monitoring/risk",
  ...overrides,
});

beforeEach(() => {
  state.assignments = [{ patientId: PATIENT_ID, userId: CLINICIAN_USER_ID, active: true }];
  state.patients = [{ id: PATIENT_ID, userId: "patient-user-1", organizationId: null }];
  state.riskEntries = [
    { id: ENTRY_ID, patientId: PATIENT_ID, reviewStatus: "PENDING", reviewedAt: null },
  ];
  state.alerts = [
    { id: ALERT_ID, patientId: PATIENT_ID, acknowledgedAt: null, reviewId: "creview1" },
  ];
  state.updated = [];
  vi.clearAllMocks();
});

describe("PATCH /risk/:patientId/:entryId/review-status", () => {
  it("rejects unknown body fields instead of silently dropping them", async () => {
    const { error } = await run("patch", "/risk/:patientId/:entryId/review-status", req({
      params: { patientId: PATIENT_ID, entryId: ENTRY_ID },
      body: { reviewStatus: "ACTIONED", currentRisk: "CRITICAL" },
    }));

    expect(error).toBeInstanceOf(ZodError);
    expect(state.updated).toHaveLength(0);
  });

  it("rejects a malformed entry id", async () => {
    const { error } = await run("patch", "/risk/:patientId/:entryId/review-status", req({
      params: { patientId: PATIENT_ID, entryId: "not-a-cuid" },
      body: { reviewStatus: "ACTIONED" },
    }));

    expect(error).toBeInstanceOf(ZodError);
    expect(state.updated).toHaveLength(0);
  });

  it("rejects a malformed patient id", async () => {
    const { error } = await run("patch", "/risk/:patientId/:entryId/review-status", req({
      params: { patientId: "../etc/passwd", entryId: ENTRY_ID },
      body: { reviewStatus: "ACTIONED" },
    }));

    expect(error).toBeInstanceOf(ZodError);
    expect(state.updated).toHaveLength(0);
  });

  it("accepts a valid status change", async () => {
    const { res, error } = await run("patch", "/risk/:patientId/:entryId/review-status", req({
      params: { patientId: PATIENT_ID, entryId: ENTRY_ID },
      body: { reviewStatus: "ACTIONED" },
    }));

    expect(error).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(state.updated[0]?.data?.reviewStatus).toBe("ACTIONED");
  });

  it("rejects a status outside the review-status enum", async () => {
    const { error } = await run("patch", "/risk/:patientId/:entryId/review-status", req({
      params: { patientId: PATIENT_ID, entryId: ENTRY_ID },
      body: { reviewStatus: "CLOSED" },
    }));

    expect(error).toBeInstanceOf(ZodError);
  });
});

describe("POST /alerts/:id/acknowledge", () => {
  it("rejects a malformed alert id", async () => {
    const { error } = await run("post", "/alerts/:id/acknowledge", req({
      method: "POST",
      params: { id: "alerts/../other" },
      body: {},
    }));

    expect(error).toBeInstanceOf(ZodError);
  });

  it("acknowledges a well-formed alert id", async () => {
    const { res, error } = await run("post", "/alerts/:id/acknowledge", req({
      method: "POST",
      params: { id: ALERT_ID },
      body: {},
    }));

    expect(error).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(res.payload?.alreadyAcknowledged).toBe(false);
  });
});

describe("POST /risk/:patientId", () => {
  it("rejects unknown body fields", async () => {
    const { error } = await run("post", "/risk/:patientId", req({
      method: "POST",
      params: { patientId: PATIENT_ID },
      body: { domain: "SAFEGUARDING", currentRisk: "LOW", currentRiskLevel: "HIGH" },
    }));

    expect(error).toBeInstanceOf(ZodError);
  });

  it("rejects a risk domain outside the enum", async () => {
    const { error } = await run("post", "/risk/:patientId", req({
      method: "POST",
      params: { patientId: PATIENT_ID },
      body: { domain: "NOT_A_DOMAIN", currentRisk: "LOW" },
    }));

    expect(error).toBeInstanceOf(ZodError);
  });
});
