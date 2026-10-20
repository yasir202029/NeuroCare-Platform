import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Role, DocumentRequestStatus } from "@prisma/client";

/**
 * Closed-loop test for the document request handoff:
 *
 * clinician requests evidence -> patient sees it outstanding -> patient uploads
 * -> clinician review task created -> clinician accepts -> task completed
 *
 * Prisma is mocked. The repository has no test-database harness, so this is a
 * route/service-level test rather than a true end-to-end database test.
 */

const PATIENT_ID = "cpatient000000000000000001";
const USER_ID = "user-1";
const CLINICIAN_USER_ID = "clin-user-1";
const REQUEST_ID = "creq0000000000000000000001";
const DOC_ID = "cdoc000000000000000000001";

const state = {
  requests: [] as any[],
  documents: [] as any[],
  versions: [] as any[],
  tasks: [] as any[],
  assignments: [] as any[],
};

vi.mock("../src/shared/db.js", () => {
  const prisma: any = {};
  prisma.patient = {
    findUnique: vi.fn(async () => ({ id: PATIENT_ID })),
  };
  prisma.patientAssignment = {
    findFirst: vi.fn(async () => state.assignments[0] ?? null),
  };
  prisma.documentRequest = {
    findUnique: vi.fn(async ({ where }: any) => state.requests.find((r) => r.id === where.id) ?? null),
    findMany: vi.fn(async () => state.requests),
    create: vi.fn(async ({ data }: any) => {
      const record = { id: REQUEST_ID, status: DocumentRequestStatus.PENDING, ...data };
      state.requests.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const record = state.requests.find((r) => r.id === where.id);
      Object.assign(record, data);
      return record;
    }),
  };
  prisma.document = {
    create: vi.fn(async ({ data }: any) => {
      const record = { id: DOC_ID, ...data };
      state.documents.push(record);
      return record;
    }),
  };
  prisma.documentVersion = {
    create: vi.fn(async ({ data }: any) => {
      const record = { id: "cver000000000000000000001", ...data };
      state.versions.push(record);
      return record;
    }),
  };
  prisma.clinicalTask = {
    upsert: vi.fn(async ({ where, create }: any) => {
      const existing = state.tasks.find((t) => t.documentRequestId === where.documentRequestId);
      if (existing) return existing;
      const task = { id: "ctask000000000000000000001", ...create };
      state.tasks.push(task);
      return task;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      state.tasks.forEach((t) => {
        if (t.documentRequestId === where.documentRequestId) Object.assign(t, data);
      });
      return { count: state.tasks.length };
    }),
  };
  prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));
  return { prisma };
});

import router from "../src/modules/documents/document-requests.routes.js";

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

const patientUser = { id: USER_ID, roles: [Role.PATIENT] };
const clinicianUser = { id: CLINICIAN_USER_ID, roles: [Role.PSYCHIATRIST] };

beforeEach(() => {
  state.requests = [];
  state.documents = [];
  state.versions = [];
  state.tasks = [];
  state.assignments = [];
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("document request closed loop", () => {
  it("a clinician requests evidence from an assigned patient", async () => {
    state.assignments.push({ id: "pa-1" });
    const { res, error } = await run("post", "/requests", {
      user: clinicianUser,
      body: { patientId: PATIENT_ID, title: "School reports", category: "SCHOOL_REPORT" },
    });
    expect(error).toBeNull();
    expect(res.payload.request.status).toBe(DocumentRequestStatus.PENDING);
    expect(res.payload.nextOwner).toBe("PATIENT");
  });

  it("refuses a request for a patient the clinician is not assigned to", async () => {
    state.assignments = [];
    const { error } = await run("post", "/requests", {
      user: clinicianUser,
      body: { patientId: PATIENT_ID, title: "School reports", category: "SCHOOL_REPORT" },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("the patient sees their own outstanding requests", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.PENDING,
    });
    const { res, error } = await run("get", "/requests", { user: patientUser });
    expect(error).toBeNull();
    expect(res.payload.requests).toHaveLength(1);
    expect(res.payload.requests[0].title).toBe("School reports");
  });

  it("uploading against a request creates a document and a review task", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.PENDING,
    });
    const { res, error } = await run("post", "/requests/:id/fulfil", {
      user: patientUser,
      params: { id: REQUEST_ID },
      body: { name: "reports.pdf", mimeType: "application/pdf", sizeBytes: 2048, type: "ATTACHMENT" },
    });
    expect(error).toBeNull();
    expect(res.payload.request.status).toBe(DocumentRequestStatus.SUBMITTED);
    expect(res.payload.nextOwner).toBe("CLINICIAN");
    expect(state.documents).toHaveLength(1);
    expect(state.versions).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].type).toBe("DOCUMENT_REVIEW");
  });

  it("refuses to fulfil a request that is no longer pending", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.ACCEPTED,
    });
    const { error } = await run("post", "/requests/:id/fulfil", {
      user: patientUser,
      params: { id: REQUEST_ID },
      body: { name: "reports.pdf", mimeType: "application/pdf", sizeBytes: 2048 },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });

  it("the requesting clinician accepts the document and closes the task", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.SUBMITTED,
      requestedById: CLINICIAN_USER_ID,
    });
    state.tasks.push({ id: "ctask000000000000000000001", documentRequestId: REQUEST_ID, status: "OPEN" });
    const { res, error } = await run("post", "/requests/:id/review", {
      user: clinicianUser,
      params: { id: REQUEST_ID },
      body: { decision: "ACCEPTED" },
    });
    expect(error).toBeNull();
    expect(res.payload.request.status).toBe(DocumentRequestStatus.ACCEPTED);
    expect(res.payload.nextOwner).toBe("PATIENT");
    expect(state.tasks[0].status).toBe("COMPLETED");
  });

  it("rejection returns the request to the patient with a reason", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.SUBMITTED,
      requestedById: CLINICIAN_USER_ID,
    });
    const { res, error } = await run("post", "/requests/:id/review", {
      user: clinicianUser,
      params: { id: REQUEST_ID },
      body: { decision: "REJECTED", notes: "Please upload a clearer copy." },
    });
    expect(error).toBeNull();
    expect(res.payload.request.status).toBe(DocumentRequestStatus.REJECTED);
    expect(res.payload.request.reviewNotes).toBe("Please upload a clearer copy.");
    expect(res.payload.nextOwner).toBe("PATIENT");
  });

  it("refuses a review by a clinician who did not make the request", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.SUBMITTED,
      requestedById: "someone-else",
    });
    const { error } = await run("post", "/requests/:id/review", {
      user: clinicianUser,
      params: { id: REQUEST_ID },
      body: { decision: "ACCEPTED" },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("rejects an invalid transition (reviewing a request that was never submitted)", async () => {
    state.requests.push({
      id: REQUEST_ID,
      patientId: PATIENT_ID,
      title: "School reports",
      status: DocumentRequestStatus.PENDING,
      requestedById: CLINICIAN_USER_ID,
    });
    const { error } = await run("post", "/requests/:id/review", {
      user: clinicianUser,
      params: { id: REQUEST_ID },
      body: { decision: "ACCEPTED" },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });
});
