import { Prisma, Role, ScreeningInstrument } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { audit } from '../../middleware/audit.js';
import {
  clinicalStaffRoles,
  requireAuth,
  requireRole,
} from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { requirePatientAccess } from '../../middleware/patient-authz.js';
import { prisma } from '../../shared/db.js';
import { badRequest, notFound, forbidden } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);

const formDefinitionSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  instrument: z.nativeEnum(ScreeningInstrument).optional(),
  category: z.string().min(1).max(50),
  fields: z.record(z.string(), z.unknown()),
  active: z.boolean().optional(),
});

const submissionSchema = z.object({
  formDefinitionId: z.string().cuid(),
  answers: z.record(z.string(), z.unknown()),
  completedAt: z.coerce.date().optional(),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { category, active } = _req.query;
    const where: Record<string, unknown> = {};
    if (category) where.category = String(category);
    if (active !== undefined) where.active = active === 'true';
    const forms = await prisma.clinicalFormDefinition.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { submissions: true } } },
    });
    res.json(forms);
  }),
);

router.post(
  '/',
  requireRole(...clinicalStaffRoles, Role.ADMIN),
  audit('CLINICAL_FORM_CREATED', 'ClinicalFormDefinition'),
  asyncHandler(async (req, res) => {
    const body = formDefinitionSchema.parse(req.body);
    const existing = await prisma.clinicalFormDefinition.findUnique({
      where: { key: body.key },
    });
    if (existing) throw badRequest('A form with this key already exists');
    const form = await prisma.clinicalFormDefinition.create({
      data: {
        ...body,
        fields: body.fields as unknown as Prisma.InputJsonValue,
        createdById: req.user!.id,
      },
    });
    res.status(201).json(form);
  }),
);

router.get(
  '/submissions',
  requirePatientAccess('query'),
  asyncHandler(async (req, res) => {
    const { formDefinitionId, patientId } = req.query;
    const where: Record<string, unknown> = {};
    if (formDefinitionId) where.formDefinitionId = String(formDefinitionId);
    if (patientId) where.patientId = String(patientId);
    const submissions = await prisma.clinicalFormSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        formDefinition: {
          select: { id: true, key: true, name: true, category: true },
        },
        patient: {
          select: {
            id: true,
            userId: true,
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(submissions);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const form = await prisma.clinicalFormDefinition.findUnique({
      where: { id: String(req.params.id) },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            patient: {
              select: {
                id: true,
                userId: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            clinician: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!form) throw notFound('Clinical form not found');
    res.json(form);
  }),
);

router.patch(
  '/:id',
  requireRole(Role.ADMIN),
  audit('CLINICAL_FORM_UPDATED', 'ClinicalFormDefinition'),
  asyncHandler(async (req, res) => {
    const body = formDefinitionSchema.partial().parse(req.body);
    const form = await prisma.clinicalFormDefinition.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!form) throw notFound('Clinical form not found');
    const updated = await prisma.clinicalFormDefinition.update({
      where: { id: String(req.params.id) },
      data: {
        ...(body.fields !== undefined
          ? { fields: body.fields as unknown as Prisma.InputJsonValue }
          : {}),
        ...(body.key !== undefined && { key: body.key }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.instrument !== undefined && { instrument: body.instrument }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  requireRole(Role.ADMIN),
  audit('CLINICAL_FORM_DELETED', 'ClinicalFormDefinition'),
  asyncHandler(async (_req, res) => {
    await prisma.clinicalFormDefinition.update({
      where: { id: String(_req.params.id) },
      data: { active: false },
    });
    res.json({ deactivated: true });
  }),
);

router.post(
  '/submissions',
  audit('CLINICAL_FORM_SUBMITTED', 'ClinicalFormSubmission'),
  asyncHandler(async (req, res) => {
    const body = submissionSchema.parse(req.body);
    const form = await prisma.clinicalFormDefinition.findUnique({
      where: { id: body.formDefinitionId },
    });
    if (!form || !form.active) throw notFound('Active clinical form not found');
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patient) throw badRequest('Patient profile not found');
    const submission = await prisma.clinicalFormSubmission.create({
      data: {
        formDefinitionId: body.formDefinitionId,
        patientId: patient.id,
        clinicianId: req.user!.roles.includes(Role.PATIENT)
          ? undefined
          : req.user!.id,
        answers: body.answers as unknown as Prisma.InputJsonValue,
        completedAt: body.completedAt ?? new Date(),
      },
      include: {
        formDefinition: { select: { id: true, key: true, name: true } },
        patient: {
          select: { id: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    res.status(201).json(submission);
  }),
);

router.get(
  '/submissions/:id',
  asyncHandler(async (req, res) => {
    const submission = await prisma.clinicalFormSubmission.findUnique({
      where: { id: String(req.params.id) },
      include: {
        formDefinition: true,
        patient: {
          select: {
            id: true,
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!submission) throw notFound('Form submission not found');
    const isAdmin = req.user!.roles.includes(Role.ADMIN);
    const isOwner =
      submission.patient.userId === req.user!.id ||
      submission.clinicianId === req.user!.id;
    if (!isAdmin && !isOwner) throw forbidden('You cannot view this submission');
    res.json(submission);
  }),
);

export default router;
