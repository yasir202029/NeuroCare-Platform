import { Router } from 'express';
import { z } from 'zod';
import { Role, ClinicalFormSubmissionStatus, TaskType, TaskStatus } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { audit } from '../../middleware/audit.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requirePatientAccess } from '../../middleware/patient-authz.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);

const clinicalStaffRoles = [Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];

const answersSchema = z.record(z.string(), z.unknown());

/** Transitions a patient is allowed to make on their own submission. */
const PATIENT_TRANSITIONS: Record<ClinicalFormSubmissionStatus, ClinicalFormSubmissionStatus[]> = {
  DRAFT: [ClinicalFormSubmissionStatus.SUBMITTED],
  SUBMITTED: [],
  UNDER_REVIEW: [],
  REVIEWED: [],
};

/** Transitions a clinician is allowed to make on a submitted submission. */
const CLINICIAN_TRANSITIONS: Record<ClinicalFormSubmissionStatus, ClinicalFormSubmissionStatus[]> = {
  DRAFT: [],
  SUBMITTED: [ClinicalFormSubmissionStatus.UNDER_REVIEW],
  UNDER_REVIEW: [ClinicalFormSubmissionStatus.REVIEWED],
  REVIEWED: [],
};

function assertTransition(
  from: ClinicalFormSubmissionStatus,
  to: ClinicalFormSubmissionStatus,
  allowed: Record<ClinicalFormSubmissionStatus, ClinicalFormSubmissionStatus[]>,
) {
  if (!allowed[from].includes(to)) {
    throw badRequest(`Invalid transition from ${from} to ${to}`);
  }
}

async function resolveOwnPatient(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) throw notFound('Patient profile not found');
  return patient;
}

/**
 * GET /questionnaires/assigned
 * The patient's own questionnaire list with real submission status.
 * This is the entry point that removes the "which questionnaire do I do?" dead end.
 */
router.get(
  '/assigned',
  asyncHandler(async (req, res) => {
    const patient = await resolveOwnPatient(req.user!.id);

    const [definitions, submissions] = await Promise.all([
      prisma.clinicalFormDefinition.findMany({
        where: { active: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        select: { id: true, key: true, name: true, description: true, version: true, category: true, instrument: true, fields: true },
      }),
      prisma.clinicalFormSubmission.findMany({
        where: { patientId: patient.id },
        select: { id: true, formDefinitionId: true, status: true, submittedAt: true, reviewedAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const byDefinition = new Map<string, (typeof submissions)[number]>();
    for (const submission of submissions) {
      if (!byDefinition.has(submission.formDefinitionId)) byDefinition.set(submission.formDefinitionId, submission);
    }

    res.json({
      patientId: patient.id,
      questionnaires: definitions.map((definition) => {
        const submission = byDefinition.get(definition.id);
        return {
          formDefinitionId: definition.id,
          key: definition.key,
          name: definition.name,
          description: definition.description,
          version: definition.version,
          category: definition.category,
          instrument: definition.instrument,
          fields: definition.fields,
          status: submission?.status ?? 'NOT_STARTED',
          submissionId: submission?.id ?? null,
          submittedAt: submission?.submittedAt ?? null,
          reviewedAt: submission?.reviewedAt ?? null,
          updatedAt: submission?.updatedAt ?? null,
        };
      }),
    });
  }),
);

/**
 * PUT /questionnaires/submissions/:formDefinitionId
 * Autosave a draft. Idempotent for a given definition — the patient's single
 * draft per questionnaire is updated in place.
 */
router.put(
  '/submissions/:formDefinitionId',
  audit('CLINICAL_FORM_DRAFT_SAVED', 'ClinicalFormSubmission'),
  asyncHandler(async (req, res) => {
    const patient = await resolveOwnPatient(req.user!.id);
    const formDefinitionId = z.string().cuid().parse(req.params.formDefinitionId);
    const body = z.object({ answers: answersSchema }).parse(req.body);

    const definition = await prisma.clinicalFormDefinition.findUnique({ where: { id: formDefinitionId } });
    if (!definition || !definition.active) throw notFound('Active questionnaire not found');

    const existing = await prisma.clinicalFormSubmission.findFirst({
      where: { formDefinitionId, patientId: patient.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing && existing.status !== ClinicalFormSubmissionStatus.DRAFT) {
      throw forbidden('This questionnaire has already been submitted and cannot be edited.');
    }

    const submission = existing
      ? await prisma.clinicalFormSubmission.update({
          where: { id: existing.id },
          data: { answers: body.answers as never },
        })
      : await prisma.clinicalFormSubmission.create({
          data: {
            formDefinitionId,
            patientId: patient.id,
            answers: body.answers as never,
            status: ClinicalFormSubmissionStatus.DRAFT,
          },
        });

    res.json({ submissionId: submission.id, status: submission.status, updatedAt: submission.updatedAt });
  }),
);

/**
 * POST /questionnaires/submissions/:id/submit
 * Finalise a draft. This is the state transition that closes the patient half
 * of the loop and creates the clinician review task.
 */
router.post(
  '/submissions/:id/submit',
  audit('CLINICAL_FORM_SUBMITTED', 'ClinicalFormSubmission'),
  asyncHandler(async (req, res) => {
    const patient = await resolveOwnPatient(req.user!.id);
    const id = z.string().cuid().parse(req.params.id);

    const submission = await prisma.clinicalFormSubmission.findUnique({
      where: { id },
      include: { formDefinition: { select: { id: true, name: true, key: true } } },
    });
    if (!submission) throw notFound('Questionnaire submission not found');
    if (submission.patientId !== patient.id) throw forbidden('You can only submit your own questionnaire.');
    assertTransition(submission.status, ClinicalFormSubmissionStatus.SUBMITTED, PATIENT_TRANSITIONS);

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const finalised = await tx.clinicalFormSubmission.update({
        where: { id },
        data: {
          status: ClinicalFormSubmissionStatus.SUBMITTED,
          submittedAt: now,
          completedAt: now,
        },
      });

      // Hand off to the clinical team. The unique constraint on
      // questionnaireSubmissionId makes repeated submissions idempotent.
      const assignment = await tx.patientAssignment.findFirst({
        where: { patientId: patient.id, active: true },
        orderBy: { startsAt: 'desc' },
        select: { userId: true },
      });

      const clinician = assignment
        ? await tx.clinician.findFirst({ where: { userId: assignment.userId }, select: { id: true } })
        : null;

      await tx.clinicalTask.upsert({
        where: { questionnaireSubmissionId: id },
        create: {
          type: TaskType.QUESTIONNAIRE_REVIEW,
          status: TaskStatus.OPEN,
          title: `Review questionnaire: ${submission.formDefinition.name}`,
          patientId: patient.id,
          assignedToId: assignment?.userId ?? undefined,
          clinicianId: clinician?.id ?? undefined,
          questionnaireSubmissionId: id,
          metadata: { formDefinitionKey: submission.formDefinition.key },
        },
        update: {},
      });

      return finalised;
    });

    res.status(200).json({
      submissionId: updated.id,
      status: updated.status,
      submittedAt: updated.submittedAt,
      nextOwner: 'CLINICIAN',
      nextAction: 'Your clinician will review this questionnaire.',
    });
  }),
);

/**
 * GET /questionnaires/submissions/:id
 * The patient's own submission.
 */
router.get(
  '/submissions/:id',
  asyncHandler(async (req, res) => {
    const patient = await resolveOwnPatient(req.user!.id);
    const id = z.string().cuid().parse(req.params.id);
    const submission = await prisma.clinicalFormSubmission.findUnique({
      where: { id },
      include: { formDefinition: { select: { id: true, key: true, name: true, version: true } } },
    });
    if (!submission) throw notFound('Questionnaire submission not found');
    if (submission.patientId !== patient.id) throw forbidden('You can only view your own questionnaire.');
    res.json({
      id: submission.id,
      formDefinitionId: submission.formDefinitionId,
      status: submission.status,
      answers: submission.answers,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      formDefinition: submission.formDefinition,
    });
  }),
);

/**
 * GET /questionnaires/review-queue
 * Clinician view: submitted questionnaires for patients assigned to this clinician.
 */
router.get(
  '/review-queue',
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const submissions = await prisma.clinicalFormSubmission.findMany({
      where: {
        status: { in: [ClinicalFormSubmissionStatus.SUBMITTED, ClinicalFormSubmissionStatus.UNDER_REVIEW] },
        patient: {
          assignments: { some: { userId: req.user!.id, active: true } },
        },
      },
      include: {
        formDefinition: { select: { id: true, key: true, name: true, version: true } },
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinicalTask: { select: { id: true, status: true, title: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
    res.json({ submissions });
  }),
);

/**
 * POST /questionnaires/submissions/:id/review
 * Clinician records the review. Completes the generated task and hands the
 * result back to the patient's pathway.
 */
router.post(
  '/submissions/:id/review',
  requireRole(...clinicalStaffRoles),
  audit('CLINICAL_FORM_REVIEWED', 'ClinicalFormSubmission'),
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = z.object({ notes: z.string().max(4000).optional() }).parse(req.body);

    const submission = await prisma.clinicalFormSubmission.findUnique({
      where: { id },
      include: { formDefinition: { select: { name: true } } },
    });
    if (!submission) throw notFound('Questionnaire submission not found');

    const assigned = await prisma.patientAssignment.findFirst({
      where: { patientId: submission.patientId, userId: req.user!.id, active: true },
    });
    if (!assigned && !req.user!.roles.includes(Role.ADMIN)) {
      throw forbidden('This patient is not assigned to you.');
    }

    const target =
      submission.status === ClinicalFormSubmissionStatus.SUBMITTED
        ? ClinicalFormSubmissionStatus.UNDER_REVIEW
        : ClinicalFormSubmissionStatus.REVIEWED;
    assertTransition(submission.status, target, CLINICIAN_TRANSITIONS);

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const reviewed = await tx.clinicalFormSubmission.update({
        where: { id },
        data: {
          status: target,
          reviewedAt: target === ClinicalFormSubmissionStatus.REVIEWED ? now : undefined,
          reviewedById: target === ClinicalFormSubmissionStatus.REVIEWED ? req.user!.id : undefined,
          reviewNotes: body.notes,
        },
      });

      if (target === ClinicalFormSubmissionStatus.REVIEWED) {
        await tx.clinicalTask.updateMany({
          where: { questionnaireSubmissionId: id, status: { not: TaskStatus.COMPLETED } },
          data: { status: TaskStatus.COMPLETED, updatedAt: now },
        });
      }

      return reviewed;
    });

    res.json({
      submissionId: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
      nextOwner: target === ClinicalFormSubmissionStatus.REVIEWED ? 'PATIENT' : 'CLINICIAN',
      nextAction:
        target === ClinicalFormSubmissionStatus.REVIEWED
          ? 'The review is complete. Your clinician will confirm the next step in your portal.'
          : 'Continue the review to record your conclusion.',
    });
  }),
);

export default router;
