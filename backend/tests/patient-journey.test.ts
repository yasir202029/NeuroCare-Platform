import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/shared/db.js", () => {
  const patientFindUnique = vi.fn();
  const consentFindMany = vi.fn();
  const appointmentFindMany = vi.fn();
  const screeningFindMany = vi.fn();
  const formSubmissionFindMany = vi.fn();
  const invoiceFindMany = vi.fn();
  const reportFindMany = vi.fn();
  const clinicalTaskFindMany = vi.fn();
  const physicalReviewFindMany = vi.fn();
  const titrationFindMany = vi.fn();
  const transitionFindFirst = vi.fn();
  const documentRequestFindMany = vi.fn();
  return {
    prisma: {
      patient: { findUnique: patientFindUnique },
      consentRecord: { findMany: consentFindMany },
      appointment: { findMany: appointmentFindMany },
      screeningResponse: { findMany: screeningFindMany },
      clinicalFormSubmission: { findMany: formSubmissionFindMany },
      invoice: { findMany: invoiceFindMany },
      report: { findMany: reportFindMany },
      clinicalTask: { findMany: clinicalTaskFindMany },
      physicalHealthReview: { findMany: physicalReviewFindMany },
      titrationPlan: { findMany: titrationFindMany },
      workflowTransition: { findFirst: transitionFindFirst },
      documentRequest: { findMany: documentRequestFindMany },
    },
    __mocks: {
      patientFindUnique,
      consentFindMany,
      appointmentFindMany,
      screeningFindMany,
      formSubmissionFindMany,
      invoiceFindMany,
      reportFindMany,
      clinicalTaskFindMany,
      physicalReviewFindMany,
      titrationFindMany,
      transitionFindFirst,
      documentRequestFindMany,
    },
  };
});

import { PatientJourneyService } from "../src/modules/portals/patient-journey.service.js";
import { __mocks as m } from "../src/shared/db.js";

const userId = "user-1";
const patientId = "patient-1";

function basePatient(overrides: Record<string, unknown> = {}) {
  return {
    id: patientId,
    dateOfBirth: new Date("1990-01-01"),
    address: { line1: "1 Test St" },
    emergencyContact: { name: "Jane" },
    preferredContact: "email",
    consentToContact: true,
    medicalHistory: null,
    organizationId: null,
    ...overrides,
  };
}

function resetMocks() {
  m.patientFindUnique.mockResolvedValue(basePatient());
  m.consentFindMany.mockResolvedValue([]);
  m.appointmentFindMany.mockResolvedValue([]);
  m.screeningFindMany.mockResolvedValue([]);
  m.formSubmissionFindMany.mockResolvedValue([]);
  m.invoiceFindMany.mockResolvedValue([]);
  m.reportFindMany.mockResolvedValue([]);
  m.clinicalTaskFindMany.mockResolvedValue([]);
  m.physicalReviewFindMany.mockResolvedValue([]);
  m.titrationFindMany.mockResolvedValue([]);
  m.transitionFindFirst.mockResolvedValue(null);
  m.documentRequestFindMany.mockResolvedValue([]);
}

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PatientJourneyService", () => {
  it("returns a not-started projection when no patient profile exists", async () => {
    m.patientFindUnique.mockResolvedValue(null);
    const result = await new PatientJourneyService().project(userId);
    expect(result.currentStage).toBe("NOT_STARTED");
    expect(result.nextAction.type).toBe("COMPLETE_ONBOARDING");
    expect(result.nextAction.blocking).toBe(true);
  });

  it("asks for profile details when the record is incomplete", async () => {
    m.patientFindUnique.mockResolvedValue(
      basePatient({ dateOfBirth: null, address: null, emergencyContact: null }),
    );
    const result = await new PatientJourneyService().project(userId);
    expect(result.nextAction.type).toBe("COMPLETE_ONBOARDING");
    expect(result.nextAction.actionUrl).toBe("/onboarding");
  });

  it("asks for consent when consent has not been recorded", async () => {
    const result = await new PatientJourneyService().project(userId);
    expect(result.nextAction.type).toBe("COMPLETE_CONSENT");
  });

  it("prioritises an outstanding payment over booking", async () => {
    m.consentFindMany.mockResolvedValue([{ type: "TREATMENT", granted: true, version: "1" }]);
    m.invoiceFindMany.mockResolvedValue([{ id: "inv-1", status: "OPEN", totalPence: 5000 }]);
    const result = await new PatientJourneyService().project(userId);
    expect(result.nextAction.type).toBe("PAY_INVOICE");
    expect(result.nextAction.blocking).toBe(true);
  });

  it("asks the patient to book when no appointment exists", async () => {
    m.consentFindMany.mockResolvedValue([{ type: "TREATMENT", granted: true, version: "1" }]);
    const result = await new PatientJourneyService().project(userId);
    expect(result.nextAction.type).toBe("BOOK_APPOINTMENT");
    expect(result.nextAction.actionUrl).toBe("/patient/book");
  });

  it("asks the patient to complete a questionnaire after booking", async () => {
    m.consentFindMany.mockResolvedValue([{ type: "TREATMENT", granted: true, version: "1" }]);
    m.appointmentFindMany.mockResolvedValue([
      {
        id: "appt-1",
        status: "CONFIRMED",
        startsAt: new Date("2099-01-01T10:00:00Z"),
        type: "ADHD_INITIAL",
      },
    ]);
    const result = await new PatientJourneyService().project(userId);
    // An outstanding questionnaire outranks appointment preparation.
    expect(result.nextAction.type).toBe("COMPLETE_QUESTIONNAIRE");
    expect(result.upcoming).toHaveLength(1);
  });

  it("surfaces an open clinical task as the next action", async () => {
    m.consentFindMany.mockResolvedValue([{ type: "TREATMENT", granted: true, version: "1" }]);
    m.appointmentFindMany.mockResolvedValue([
      {
        id: "appt-1",
        status: "CONFIRMED",
        startsAt: new Date("2099-01-01T10:00:00Z"),
        type: "ADHD_INITIAL",
      },
    ]);
    m.clinicalTaskFindMany.mockResolvedValue([
      { id: "task-1", title: "Submit your sleep diary", type: "OBSERVATION" },
    ]);
    const result = await new PatientJourneyService().project(userId);
    expect(result.nextAction.type).toBe("SUBMIT_OBSERVATIONS");
    expect(result.nextAction.title).toBe("Submit your sleep diary");
    expect(result.outstanding).toHaveLength(1);
  });

  it("does not fabricate clinical content when nothing is outstanding", async () => {
    m.consentFindMany.mockResolvedValue([{ type: "TREATMENT", granted: true, version: "1" }]);
    m.appointmentFindMany.mockResolvedValue([
      {
        id: "appt-1",
        status: "COMPLETED",
        startsAt: new Date("2020-01-01T10:00:00Z"),
        type: "ADHD_INITIAL",
      },
    ]);
    m.formSubmissionFindMany.mockResolvedValue([{ id: "sub-1", status: "SUBMITTED", submittedAt: new Date(), formDefinition: { name: "ASRS" } }]);
    m.transitionFindFirst.mockResolvedValue({ id: "wt-1" });
    m.physicalReviewFindMany.mockResolvedValue([{ id: "phr-1" }]);
    const result = await new PatientJourneyService().project(userId);
    expect(result.nextAction.type).toBe("AWAIT_CLINICAL_OUTCOME");
    expect(result.nextAction.blocking).toBe(false);
  });

  it("exposes approved reports as recent patient-visible updates only", async () => {
    m.consentFindMany.mockResolvedValue([{ type: "TREATMENT", granted: true, version: "1" }]);
    m.appointmentFindMany.mockResolvedValue([
      {
        id: "appt-1",
        status: "COMPLETED",
        startsAt: new Date("2020-01-01T10:00:00Z"),
        type: "ADHD_INITIAL",
      },
    ]);
    m.formSubmissionFindMany.mockResolvedValue([{ id: "sub-1", status: "SUBMITTED", submittedAt: new Date(), formDefinition: { name: "ASRS" } }]);
    m.transitionFindFirst.mockResolvedValue({ id: "wt-1" });
    m.reportFindMany.mockResolvedValue([
      {
        id: "rep-1",
        title: "ADHD assessment report",
        kind: "ADHD_INITIAL",
        createdAt: new Date("2024-05-01T00:00:00Z"),
      },
    ]);
    const result = await new PatientJourneyService().project(userId);
    expect(result.recentUpdates).toHaveLength(1);
    expect(result.recentUpdates[0].id).toBe("rep-1");
  });
});
