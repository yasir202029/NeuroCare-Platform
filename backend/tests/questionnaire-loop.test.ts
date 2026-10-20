import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Role, ClinicalFormSubmissionStatus } from "@prisma/client";

/**
 * Closed-loop test for the patient questionnaire handoff:
 *
 * patient drafts -> patient submits (immutable) -> clinician review task created
 * -> clinician starts review -> clinician completes review -> task completed
 *
 * These are service/route-level tests with the Prisma layer mocked. The
 * repository has no test-database harness, so this is NOT a full end-to-end
 * test against a real database — see the audit report for that limitation.
 */

const PATIENT = { id: "cpatient000000000000000001", userId: "user-1" };
const DEF_ID = "cform00000000000000000001";

const mockState = {
  patient: PATIENT,
  definition: {
    id: DEF_ID,
    key: "asrs",
    name: "ASRS",
    description: null,
    version: 1,
    category: "screening",
    instrument: "ASRS",
    fields: [],
    active: true,
  },
  submissions: [] as any[],
  tasks: [] as any[],
  assignments: [] as any[],
  clinicians: [] as any[],
};

vi.mock("../src/shared/db.js", () => {
  const prisma: any = {};
  prisma.patient = {
    findUnique: vi.fn(async () => PATIENT),
  };
  prisma.clinicalFormDefinition = {
    findUnique: vi.fn(async ({ where }: any) => (where.id === DEF_ID ? mockState.definition : null)),
    findMany: vi.fn(async () => [mockState.definition]),
  };
  prisma.clinicalFormSubmission = {
    findFirst: vi.fn(async () => mockState.submissions[0] ?? null),
    findUnique: vi.fn(async ({ where }: any) => mockState.submissions.find((s) => s.id === where.id) ?? null),
    create: vi.fn(async ({ data }: any) => {
      const record = { id: `csub0000000000000000000${mockState.submissions.length + 1}`, ...data, submittedAt: null, reviewedAt: null };
      mockState.submissions.push(record);
      return record;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const record = mockState.submissions.find((s) => s.id === where.id);
      Object.assign(record, data);
      return record;
    }),
    findMany: vi.fn(async () => mockState.submissions),
  };
  prisma.clinicalTask = {
    upsert: vi.fn(async ({ where, create }: any) => {
      const existing = mockState.tasks.find((t) => t.questionnaireSubmissionId === where.questionnaireSubmissionId);
      if (existing) return existing;
      const task = { id: `ctask0000000000000000000${mockState.tasks.length + 1}`, ...create };
      mockState.tasks.push(task);
      return task;
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      mockState.tasks.forEach((t) => {
        if (t.questionnaireSubmissionId === where.questionnaireSubmissionId) Object.assign(t, data);
      });
      return { count: mockState.tasks.length };
    }),
  };
  prisma.patientAssignment = {
    findFirst: vi.fn(async () => mockState.assignments[0] ?? null),
  };
  prisma.clinician = {
    findFirst: vi.fn(async () => mockState.clinicians[0] ?? null),
  };
  prisma.$transaction = vi.fn(async (fn: any) => fn(prisma));
  return { prisma };
});

import prisma from "../src/shared/db.js";
import router from "../src/modules/questionnaires/questionnaires.routes.js";

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
  // asyncHandler forwards to next() asynchronously, so let the handler settle.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { res, error };
}

const patientUser = { id: "user-1", roles: [Role.PATIENT] };
const clinicianUser = { id: "clin-user-1", roles: [Role.PSYCHIATRIST] };

beforeEach(() => {
  mockState.submissions = [];
  mockState.tasks = [];
  mockState.assignments = [];
  mockState.clinicians = [];
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("questionnaire closed loop", () => {
  it("lists the patient's own questionnaires with a real status", async () => {
    const { res, error } = await run("get", "/assigned", { user: patientUser });
    expect(error).toBeNull();
    expect(res.payload.questionnaires[0].status).toBe("NOT_STARTED");
    expect(res.payload.questionnaires[0].key).toBe("asrs");
  });

  it("saves a draft without submitting it", async () => {
    const { res, error } = await run("put", "/submissions/:formDefinitionId", {
      user: patientUser,
      params: { formDefinitionId: DEF_ID },
      body: { answers: { q1: "yes" } },
    });
    expect(error).toBeNull();
    expect(res.payload.status).toBe(ClinicalFormSubmissionStatus.DRAFT);
    expect(mockState.submissions[0].submittedAt).toBeNull();
  });

  it("finalises a draft on submit and records who owns the next step", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000001",
      patientId: PATIENT.id,
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.DRAFT,
      submittedAt: null,
      completedAt: null,
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    const { res, error } = await run("post", "/submissions/:id/submit", {
      user: patientUser,
      params: { id: "csub00000000000000000001" },
    });
    expect(error).toBeNull();
    expect(res.payload.status).toBe(ClinicalFormSubmissionStatus.SUBMITTED);
    expect(res.payload.nextOwner).toBe("CLINICIAN");
    expect(res.payload.nextAction).toMatch(/review/i);
  });

  it("creates exactly one clinician review task per submission", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000001",
      patientId: PATIENT.id,
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.DRAFT,
      submittedAt: null,
      completedAt: null,
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    await run("post", "/submissions/:id/submit", { user: patientUser, params: { id: "csub00000000000000000001" } });
    expect(mockState.tasks).toHaveLength(1);
    expect(mockState.tasks[0].type).toBe("QUESTIONNAIRE_REVIEW");
    expect(mockState.tasks[0].status).toBe("OPEN");

    // A repeated submit must be rejected, so no duplicate task is created.
    const { error } = await run("post", "/submissions/:id/submit", {
      user: patientUser,
      params: { id: "csub00000000000000000001" },
    });
    expect(error).toBeDefined();
    expect(mockState.tasks).toHaveLength(1);
  });

  it("refuses to let a patient submit another patient's questionnaire", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000002",
      patientId: "cpatient00000000000000000002",
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.DRAFT,
      submittedAt: null,
      completedAt: null,
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    const { error } = await run("post", "/submissions/:id/submit", {
      user: patientUser,
      params: { id: "csub00000000000000000002" },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("refuses to let a patient edit a submitted questionnaire", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000003",
      patientId: PATIENT.id,
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      completedAt: new Date(),
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    const { error } = await run("put", "/submissions/:formDefinitionId", {
      user: patientUser,
      params: { formDefinitionId: DEF_ID },
      body: { answers: { q1: "changed" } },
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("moves a submission to UNDER_REVIEW then REVIEWED and completes the task", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000004",
      patientId: PATIENT.id,
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      completedAt: new Date(),
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    mockState.tasks.push({
      id: "ctask00000000000000000001",
      questionnaireSubmissionId: "csub00000000000000000004",
      status: "OPEN",
    });
    mockState.assignments.push({ userId: "clin-user-1" });

    const start = await run("post", "/submissions/:id/review", {
      user: clinicianUser,
      params: { id: "csub00000000000000000004" },
      body: { notes: "Reviewing" },
    });
    expect(start.error).toBeNull();
    expect(start.res.payload.status).toBe(ClinicalFormSubmissionStatus.UNDER_REVIEW);
    expect(start.res.payload.nextOwner).toBe("CLINICIAN");

    const finish = await run("post", "/submissions/:id/review", {
      user: clinicianUser,
      params: { id: "csub00000000000000000004" },
      body: { notes: "Reviewed and understood" },
    });
    expect(finish.error).toBeNull();
    expect(finish.res.payload.status).toBe(ClinicalFormSubmissionStatus.REVIEWED);
    expect(finish.res.payload.nextOwner).toBe("PATIENT");
    expect(mockState.tasks[0].status).toBe("COMPLETED");
  });

  it("refuses a review by a clinician who is not assigned to the patient", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000005",
      patientId: PATIENT.id,
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      completedAt: new Date(),
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    mockState.assignments = [];
    const { error } = await run("post", "/submissions/:id/review", {
      user: clinicianUser,
      params: { id: "csub00000000000000000005" },
      body: {},
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  it("rejects an invalid state transition (reviewing a draft)", async () => {
    mockState.submissions.push({
      id: "csub00000000000000000006",
      patientId: PATIENT.id,
      formDefinitionId: DEF_ID,
      status: ClinicalFormSubmissionStatus.DRAFT,
      submittedAt: null,
      completedAt: null,
      formDefinition: { name: "ASRS", key: "asrs" },
    });
    mockState.assignments.push({ userId: "clin-user-1" });
    const { error } = await run("post", "/submissions/:id/review", {
      user: clinicianUser,
      params: { id: "csub00000000000000000006" },
      body: {},
    });
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
  });
});
