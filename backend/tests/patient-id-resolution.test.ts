import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Role } from "@prisma/client";

/**
 * Regression tests for patient-id resolution.
 *
 * The generic `requirePatientAccess` middleware used to fall back to
 * `params.id`, which silently treated non-patient resource ids (a document id,
 * a document-request id) as patient ids. These tests lock in the corrected
 * behaviour: only an explicit `patientId` is resolved generically, and routes
 * that own a differently named id check ownership against the resource's own
 * patientId.
 */

const OWN_PATIENT_ID = "cpatient000000000000000001";
const OTHER_PATIENT_ID = "cpatient000000000000000002";
const CALLER_USER_ID = "user-1";
const OTHER_USER_ID = "user-2";

const state = {
  documents: [] as any[],
  requests: [] as any[],
  assignments: [] as any[],
};

/** Patients keyed by id, so the mock respects the requested record. */
const patients: Record<string, { id: string; userId: string; organizationId: string | null }> = {
  [OWN_PATIENT_ID]: { id: OWN_PATIENT_ID, userId: CALLER_USER_ID, organizationId: null },
  [OTHER_PATIENT_ID]: { id: OTHER_PATIENT_ID, userId: OTHER_USER_ID, organizationId: null },
};

vi.mock("../src/shared/db.js", () => {
  const prisma: any = {};
  prisma.patient = {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where?.userId) {
        const match = Object.values(patients).find((p) => p.userId === where.userId);
        return match ?? null;
      }
      return patients[where?.id] ?? null;
    }),
  };
  prisma.organizationMember = {
    findMany: vi.fn(async () => []),
  };
  prisma.patientAssignment = {
    findFirst: vi.fn(async () => state.assignments[0] ?? null),
  };
  prisma.document = {
    findUnique: vi.fn(async ({ where }: any) => state.documents.find((d) => d.id === where.id) ?? null),
    findMany: vi.fn(async () => state.documents),
    create: vi.fn(async ({ data }: any) => {
      const record = { id: "cdoc000000000000000000001", ...data };
      state.documents.push(record);
      return record;
    }),
    update: vi.fn(async ({ where }: any) => state.documents.find((d) => d.id === where.id)),
  };
  prisma.documentVersion = { create: vi.fn(async () => ({})) };
  prisma.documentAccessLog = { create: vi.fn(async () => ({})) };
  prisma.documentRequest = {
    findUnique: vi.fn(async ({ where }: any) => state.requests.find((r) => r.id === where.id) ?? null),
    findMany: vi.fn(async () => state.requests),
    create: vi.fn(async ({ data }: any) => {
      const record = { id: "creq0000000000000000000001", status: "PENDING", ...data };
      state.requests.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const record = state.requests.find((r) => r.id === where.id);
      Object.assign(record, data);
      return record;
    }),
  };
  prisma.clinicalTask = {
    upsert: vi.fn(async ({ create }: any) => create),
    updateMany: vi.fn(async () => ({ count: 0 })),
  };
  prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));
  return { prisma };
});

import { requirePatientAccess } from "../src/middleware/patient-authz.js";
import documentsRouter from "../src/modules/documents/documents.routes.js";
import requestRouter from "../src/modules/documents/document-requests.routes.js";

type Handler = (req: any, res: any, next: any) => any;

function routeFor(router: any, method: string, path: string): Handler {
  const layer = router.stack.find((l: any) => l.route?.path === path && l.route?.methods[method] === true);
  if (!layer) throw new Error(`Route ${method} ${path} not found`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

async function run(router: any, method: string, path: string, req: any) {
  const handler = routeFor(router, method, path);
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
    send() {
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

const patientUser = { id: CALLER_USER_ID, roles: [Role.PATIENT] };
const clinicianUser = { id: "clin-user-1", roles: [Role.PSYCHIATRIST] };

beforeEach(() => {
  state.documents = [];
  state.requests = [];
  state.assignments = [];
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("patient id resolution", () => {
  it("does not treat a generic :id as a patient id", async () => {
    let error: any = null;
    requirePatientAccess("params")(
      { user: patientUser, params: { id: "cdoc-not-a-patient" }, query: {}, body: {} } as any,
      {} as any,
      (e: any) => {
        error = e;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(error).toBeFalsy();
  });

  it("resolves an explicit :patientId and enforces access", async () => {
    let error: any = null;
    requirePatientAccess("params")(
      { user: patientUser, params: { patientId: OTHER_PATIENT_ID }, query: {}, body: {} } as any,
      {} as any,
      (e: any) => {
        error = e;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("allows the patient's own :patientId", async () => {
    let error: any = null;
    requirePatientAccess("params")(
      { user: patientUser, params: { patientId: OWN_PATIENT_ID }, query: {}, body: {} } as any,
      {} as any,
      (e: any) => {
        error = e;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(error).toBeFalsy();
  });
});

describe("document ownership", () => {
  it("allows a patient to read their own document", async () => {
    state.documents.push({ id: "cdoc000000000000000000001", patientId: OWN_PATIENT_ID, name: "report.pdf" });
    const { res, error } = await run(documentsRouter, "get", "/:id", {
      user: patientUser,
      params: { id: "cdoc000000000000000000001" },
    });
    expect(error).toBeFalsy();
    expect(res.payload.name).toBe("report.pdf");
  });

  it("refuses a patient reading another patient's document", async () => {
    state.documents.push({ id: "cdoc000000000000000000002", patientId: OTHER_PATIENT_ID, name: "other.pdf" });
    const { error } = await run(documentsRouter, "get", "/:id", {
      user: patientUser,
      params: { id: "cdoc000000000000000000002" },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });
});

describe("document request ownership", () => {
  it("lets a patient fulfil their own request", async () => {
    state.requests.push({ id: "creq0000000000000000000001", patientId: OWN_PATIENT_ID, title: "Reports", status: "PENDING" });
    const { res, error } = await run(requestRouter, "post", "/requests/:id/fulfil", {
      user: patientUser,
      params: { id: "creq0000000000000000000001" },
      body: { name: "r.pdf", mimeType: "application/pdf", sizeBytes: 100 },
    });
    expect(error).toBeFalsy();
    expect(res.payload.request.status).toBe("SUBMITTED");
  });

  it("refuses a patient fulfilling another patient's request", async () => {
    state.requests.push({ id: "creq0000000000000000000002", patientId: OTHER_PATIENT_ID, title: "Reports", status: "PENDING" });
    const { error } = await run(requestRouter, "post", "/requests/:id/fulfil", {
      user: patientUser,
      params: { id: "creq0000000000000000000002" },
      body: { name: "r.pdf", mimeType: "application/pdf", sizeBytes: 100 },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });
});

describe("document route ordering", () => {
  it("mounts document-request routes before the generic /:id route", async () => {
    // Regression: '/documents/requests' was shadowed by '/documents/:id', so a
    // patient's request list resolved to a document lookup instead.
    const { default: appRoutes } = await import("../src/routes/index.js");
    const { default: documentRouter } = await import("../src/modules/documents/documents.routes.js");
    const { default: requestRouter } = await import(
      "../src/modules/documents/document-requests.routes.js"
    );

    const stack = (appRoutes as any).stack as any[];
    const requestIndex = stack.findIndex((layer) => layer.handle === requestRouter);
    const documentIndex = stack.findIndex((layer) => layer.handle === documentRouter);

    expect(requestIndex).toBeGreaterThanOrEqual(0);
    expect(documentIndex).toBeGreaterThanOrEqual(0);
    expect(requestIndex).toBeLessThan(documentIndex);
  });
});
