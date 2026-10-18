import { Router } from 'express';
import { z } from 'zod';
import { Role, Prisma } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { AiService } from '../../services/ai.service.js';
import { prisma } from '../../shared/db.js';
import { audit } from '../../middleware/audit.js';
import { notFound } from '../../shared/errors.js';

const router = Router();
const service = new AiService();
router.use(requireAuth, requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN));

router.post(
  '/report-draft',
  asyncHandler(async (req, res) => {
    const body = z.object({
      assessmentType: z.string(),
      clinicalFacts: z.string().min(1).max(50000),
      recommendations: z.string().max(20000).optional(),
    }).parse(req.body);
    res.json(await service.draftClinicalReport(body));
  }),
);

router.post(
  '/summarise',
  asyncHandler(async (req, res) => {
    const body = z.object({ text: z.string().min(1).max(50000) }).parse(req.body);
    res.json(await service.summarise(body.text));
  }),
);

router.post(
  '/consultation-insights',
  audit('AI_CONSULTATION_INSIGHTS', 'AiInsight'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      patientId: z.string().cuid(),
      transcript: z.string().optional(),
      clinicalNotes: z.string().optional(),
      assessmentData: z.record(z.string(), z.unknown()).optional(),
    }).parse(req.body);
    res.json(await service.generateConsultationInsights(body));
  }),
);

router.get(
  '/insights/:patientId',
  asyncHandler(async (req, res) => {
    const insights = await prisma.aiInsight.findMany({
      where: { patientId: String(req.params.patientId), dismissed: false },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    });
    res.json(insights);
  }),
);

router.patch(
  '/insights/:id/dismiss',
  asyncHandler(async (req, res) => {
    const insight = await prisma.aiInsight.findUnique({ where: { id: String(req.params.id) } });
    if (!insight) throw notFound('Insight not found');
    const updated = await prisma.aiInsight.update({
      where: { id: String(req.params.id) },
      data: { dismissed: true, dismissedAt: new Date() },
    });
    res.json(updated);
  }),
);

router.post(
  '/letter',
  audit('AI_LETTER_GENERATED', 'AiGeneratedDocument'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      patientId: z.string().cuid(),
      type: z.enum(['GP_LETTER', 'SHARED_CARE_LETTER', 'ASSESSMENT_REPORT', 'REFERRAL_LETTER']),
      recipient: z.string().min(1),
      clinicalContext: z.string().min(1),
      templateKey: z.string().optional(),
    }).parse(req.body);
    res.json(await service.generateLetter(body));
  }),
);

router.post(
  '/medication-safety',
  audit('AI_MEDICATION_SAFETY_CHECK', 'MedicationSafetyAlert'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      patientId: z.string().cuid(),
      medication: z.string().min(1),
      currentMedications: z.array(z.string()).default([]),
      conditions: z.array(z.string()).default([]),
      allergies: z.array(z.string()).default([]),
      age: z.number().int().positive().optional(),
      pregnancyStatus: z.boolean().optional(),
    }).parse(req.body);
    res.json(await service.checkMedicationSafety(body));
  }),
);

router.post(
  '/risk-prediction',
  audit('AI_RISK_PREDICTION', 'AiInsight'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      patientId: z.string().cuid(),
      clinicalData: z.record(z.string(), z.unknown()),
      history: z.string().optional(),
    }).parse(req.body);
    res.json(await service.predictRisk(body));
  }),
);

router.post(
  '/titration-plan',
  audit('AI_TITRATION_PLAN', 'AiRun'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      patientId: z.string().cuid(),
      currentMedication: z.string().min(1),
      currentDose: z.string().min(1),
      response: z.string().min(1),
      sideEffects: z.string().min(1),
      targetOutcome: z.string().min(1),
    }).parse(req.body);
    res.json(await service.generateTitrationPlan(body));
  }),
);

router.post(
  '/templates',
  requireRole(Role.ADMIN),
  audit('AI_TEMPLATE_CREATED', 'AiTemplate'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      key: z.string().min(1).max(100),
      name: z.string().min(1).max(200),
      type: z.enum([
        'GP_LETTER',
        'SHARED_CARE_LETTER',
        'ASSESSMENT_REPORT',
        'TITRATION_PLAN',
        'MEDICATION_REVIEW',
        'REFERRAL_LETTER',
      ]),
      content: z.string().min(1),
      variables: z.record(z.string(), z.unknown()).optional(),
    }).parse(req.body);
    const template = await prisma.aiTemplate.create({
      data: { ...body, variables: (body.variables ?? {}) as unknown as Prisma.InputJsonValue, createdById: req.user!.id },
    });
    res.status(201).json(template);
  }),
);

router.get(
  '/templates',
  asyncHandler(async (_req, res) => {
    const templates = await prisma.aiTemplate.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json(templates);
  }),
);

router.get(
  '/templates/:id',
  asyncHandler(async (req, res) => {
    const template = await prisma.aiTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!template) throw notFound('Template not found');
    res.json(template);
  }),
);

export default router;
