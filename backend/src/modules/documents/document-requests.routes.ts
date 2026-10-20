import { Router } from 'express';
import { z } from 'zod';
import { Role, DocumentRequestStatus, TaskType, TaskStatus } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { audit } from '../../middleware/audit.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);

const clinicalStaffRoles = [Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];

/** Transitions a clinician may make on a document request. */
const REQUESTER_TRANSITIONS: Record<DocumentRequestStatus, DocumentRequestStatus[]> = {
  PENDING: [DocumentRequestStatus.CANCELLED],
  SUBMITTED: [DocumentRequestStatus.ACCEPTED, DocumentRequestStatus.REJECTED],
  ACCEPTED: [],
  REJECTED: [DocumentRequestStatus.PENDING],
  CANCELLED: [],
};

function assertTransition(from: DocumentRequestStatus, to: DocumentRequestStatus) {
  if (!REQUESTER_TRANSITIONS[from].includes(to)) {
    throw badRequest(`Invalid transition from ${from} to ${to}`);
  }
}

async function ownPatient(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) throw notFound('Patient profile not found');
  return patient;
}

async function assertClinicianScope(userId: string, roles: Role[], patientId: string) {
  if (roles.includes(Role.ADMIN)) return;
  const assignment = await prisma.patientAssignment.findFirst({
    where: { patientId, userId, active: true },
    select: { id: true },
  });
  if (!assignment) throw forbidden('This patient is not assigned to you.');
}

/**
 * POST /documents/requests
 * A clinician requests supporting evidence from a patient.
 * The request becomes an outstanding patient action.
 */
router.post(
  '/requests',
  requireRole(...clinicalStaffRoles),
  audit('DOCUMENT_REQUESTED', 'DocumentRequest'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        patientId: z.string().cuid(),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional(),
        category: z.string().trim().min(1).max(60),
        dueAt: z.coerce.date().optional(),
      })
      .parse(req.body);

    await assertClinicianScope(req.user!.id, req.user!.roles, body.patientId);

    const request = await prisma.documentRequest.create({
      data: {
        patientId: body.patientId,
        requestedById: req.user!.id,
        title: body.title,
        description: body.description,
        category: body.category,
        dueAt: body.dueAt,
      },
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(201).json({
      request,
      nextOwner: 'PATIENT',
      nextAction: 'The patient can now upload the requested document.',
    });
  }),
);

/**
 * GET /documents/requests/mine
 * The requesting clinician's own requests.
 */
router.get(
  '/requests/mine',
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const requests = await prisma.documentRequest.findMany({
      where: { requestedById: req.user!.id },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        document: { select: { id: true, name: true, mimeType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests });
  }),
);

/**
 * GET /documents/requests
 * The patient's own outstanding and completed requests.
 */
router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const patient = await ownPatient(req.user!.id);
    const requests = await prisma.documentRequest.findMany({
      where: { patientId: patient.id },
      include: {
        requestedBy: { select: { firstName: true, lastName: true } },
        document: { select: { id: true, name: true, mimeType: true, sizeBytes: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ requests });
  }),
);

/**
 * POST /documents/requests/:id/fulfil
 * The patient uploads a document against an outstanding request.
 * This closes the patient half of the loop and creates the clinician review task.
 */
router.post(
  '/requests/:id/fulfil',
  audit('DOCUMENT_REQUEST_FULFILLED', 'DocumentRequest'),
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = z
      .object({
        name: z.string().trim().min(1).max(255),
        mimeType: z.string().trim().min(1).max(100),
        sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
        type: z
          .enum(['SCHOOL_REPORT', 'BLOOD_TEST', 'ECG_RESULT', 'GP_LETTER', 'PHYSICAL_HEALTH', 'ASSESSMENT_FORM', 'CLINICAL_LETTER', 'ATTACHMENT', 'OTHER'])
          .default('OTHER'),
        content: z.string().optional(),
      })
      .parse(req.body);

    const request = await prisma.documentRequest.findUnique({
      where: { id },
      include: { patient: { select: { id: true } } },
    });
    if (!request) throw notFound('Document request not found');
    if (request.status !== DocumentRequestStatus.PENDING) {
      throw badRequest('This request is no longer awaiting a document.');
    }

    // The request id is not a patient id, so ownership is checked against the
    // request's own patient. A patient may only fulfil their own request;
    // staff must be assigned to the patient.
    if (req.user!.roles.includes(Role.PATIENT)) {
      const patient = await ownPatient(req.user!.id);
      if (request.patientId !== patient.id) {
        throw forbidden('You can only upload documents for your own requests.');
      }
    } else {
      await assertClinicianScope(req.user!.id, req.user!.roles, request.patientId);
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          patientId: request.patientId,
          type: body.type,
          name: body.name,
          mimeType: body.mimeType,
          sizeBytes: body.sizeBytes,
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId: document.id,
          version: 1,
          storageProvider: 'inline',
          storageBucket: 'local',
          storagePath: `documents/${document.id}/v1`,
          uploadedById: req.user!.id,
        },
      });

      const fulfilled = await tx.documentRequest.update({
        where: { id },
        data: { status: DocumentRequestStatus.SUBMITTED, documentId: document.id, updatedAt: now },
      });

      await tx.clinicalTask.upsert({
        where: { documentRequestId: id },
        create: {
          type: TaskType.DOCUMENT_REVIEW,
          status: TaskStatus.OPEN,
          title: `Review document: ${request.title}`,
          patientId: request.patientId,
          assignedToId: request.requestedById,
          documentRequestId: id,
          metadata: { documentId: document.id },
        },
        update: {},
      });

      return { document, fulfilled };
    });

    res.status(201).json({
      request: result.fulfilled,
      documentId: result.document.id,
      nextOwner: 'CLINICIAN',
      nextAction: 'Your clinician will review the document you uploaded.',
    });
  }),
);

/**
 * POST /documents/requests/:id/review
 * The requesting clinician accepts or rejects the uploaded document.
 */
router.post(
  '/requests/:id/review',
  requireRole(...clinicalStaffRoles),
  audit('DOCUMENT_REQUEST_REVIEWED', 'DocumentRequest'),
  asyncHandler(async (req, res) => {
    const id = z.string().cuid().parse(req.params.id);
    const body = z
      .object({
        decision: z.enum(['ACCEPTED', 'REJECTED']),
        notes: z.string().trim().max(2000).optional(),
      })
      .parse(req.body);

    const request = await prisma.documentRequest.findUnique({ where: { id } });
    if (!request) throw notFound('Document request not found');
    if (request.requestedById !== req.user!.id && !req.user!.roles.includes(Role.ADMIN)) {
      throw forbidden('Only the clinician who made this request can review it.');
    }

    const target = body.decision as DocumentRequestStatus;
    assertTransition(request.status, target);

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const reviewed = await tx.documentRequest.update({
        where: { id },
        data: { status: target, reviewNotes: body.notes, reviewedAt: now, updatedAt: now },
      });

      await tx.clinicalTask.updateMany({
        where: { documentRequestId: id, status: { not: TaskStatus.COMPLETED } },
        data: { status: TaskStatus.COMPLETED, updatedAt: now },
      });

      return reviewed;
    });

    res.json({
      request: updated,
      nextOwner: 'PATIENT',
      nextAction:
        target === DocumentRequestStatus.ACCEPTED
          ? 'Your clinician accepted the document. Nothing more is needed from you.'
          : 'Your clinician asked for something different. Your portal will show what is needed.',
    });
  }),
);

export default router;
