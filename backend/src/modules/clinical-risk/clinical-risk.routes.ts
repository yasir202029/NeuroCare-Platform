import { Prisma, RiskBand, Role, AuditSeverity } from '@prisma/client';
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

const computeRisk = (answers: Record<string, unknown>) => {
  const factors: Record<string, { score: number; label: string }> = {};
  let total = 0;

  const inattention = Number(answers.inattention ?? 0);
  const hyperactivity = Number(answers.hyperactivity ?? 0);
  const impulsivity = Number(answers.impulsivity ?? 0);
  const sleepIssues = answers.sleepIssues === true ? 1 : 0;
  const schoolImpact = answers.schoolImpact === true ? 1 : 0;
  const comorbidities = Number(answers.comorbidities ?? 0);

  factors.inattention = { score: inattention, label: 'Inattention (ASRS)' };
  factors.hyperactivity = { score: hyperactivity, label: 'Hyperactivity (ASRS)' };
  factors.impulsivity = { score: impulsivity, label: 'Impulsivity (ASRS)' };
  factors.sleepIssues = { score: sleepIssues, label: 'Sleep disturbance' };
  factors.schoolImpact = { score: schoolImpact, label: 'Educational impact' };
  factors.comorbidities = { score: comorbidities * 2, label: 'Comorbid conditions' };

  total = inattention + hyperactivity + impulsivity + sleepIssues + schoolImpact + comorbidities * 2;

  let band: RiskBand = RiskBand.LOW;
  if (total >= 18) band = RiskBand.CRITICAL;
  else if (total >= 12) band = RiskBand.HIGH;
  else if (total >= 6) band = RiskBand.MODERATE;

  return { total, band, factors };
};

const bandToRankWeight: Record<RiskBand, number> = {
  [RiskBand.CRITICAL]: 100,
  [RiskBand.HIGH]: 70,
  [RiskBand.MODERATE]: 40,
  [RiskBand.LOW]: 10,
};

router.get(
  '/risk-scores',
  requirePatientAccess('query'),
  asyncHandler(async (req, res) => {
    const { patientId, riskBand } = req.query;
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = String(patientId);
    if (riskBand) where.riskBand = String(riskBand);
    const scores = await prisma.clinicalRiskScore.findMany({
      where,
      orderBy: [{ overallScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(scores);
  }),
);

router.post(
  '/risk-scores',
  requireRole(...clinicalStaffRoles, Role.ADMIN),
  requirePatientAccess('body'),
  audit('CLINICAL_RISK_SCORE_CREATED', 'ClinicalRiskScore'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        patientId: z.string().cuid(),
        answers: z.record(z.string(), z.unknown()),
        clinicianId: z.string().cuid().optional(),
      })
      .parse(req.body);

    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!patient) throw badRequest('Patient not found');

    const { total, band, factors } = computeRisk(body.answers);
    const score = await prisma.clinicalRiskScore.create({
      data: {
        patientId: body.patientId,
        clinicianId: body.clinicianId ?? req.user!.id,
        overallScore: total,
        riskBand: band,
        factors: factors as unknown as Prisma.InputJsonValue,
        reviewedAt: new Date(),
        nextReviewDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (band === RiskBand.CRITICAL || band === RiskBand.HIGH) {
      await prisma.medicationSafetyAlert.create({
        data: {
          patientId: body.patientId,
          clinicianId: req.user!.id,
          alertType: `RISK_${band}`,
          severity: band === RiskBand.CRITICAL ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
          message: `Patient ${patient.user?.firstName} ${patient.user?.lastName} ranked ${band} risk (score ${total}). Immediate review recommended.`,
        },
      });
    }

    res.status(201).json(score);
  }),
);

router.get(
  '/rankings',
  asyncHandler(async (req, res) => {
    const { portal } = req.query;
    const where: Record<string, unknown> = {};
    if (portal) where.portal = String(portal);
    const rankings = await prisma.patientRanking.findMany({
      where,
      orderBy: [{ rankPosition: 'asc' }],
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(rankings);
  }),
);

router.post(
  '/rankings/recompute',
  requireRole(Role.ADMIN),
  audit('PATIENT_RANKING_RECOMPUTED', 'PatientRanking'),
  asyncHandler(async (req, res) => {
    const { portal } = z.object({ portal: z.string().default('clinician') }).parse(req.query);

    const scores = await prisma.clinicalRiskScore.findMany({
      orderBy: [{ overallScore: 'desc' }, { createdAt: 'desc' }],
      include: { patient: true },
    });

    await prisma.patientRanking.deleteMany({ where: { portal: String(portal) } });

    const created = await prisma.$transaction(
      scores.map((score, index) =>
        prisma.patientRanking.create({
          data: {
            patientId: score.patientId,
            rankPosition: index + 1,
            score: score.overallScore,
            reason: `Risk score ${score.overallScore} (${score.riskBand})`,
            portal: String(portal),
          },
        }),
      ),
    );

    res.json({ recomputed: created.length, rankings: created });
  }),
);

router.get(
  '/safety-alerts',
  asyncHandler(async (req, res) => {
    const { patientId, acknowledged } = req.query;
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = String(patientId);
    if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';
    const alerts = await prisma.medicationSafetyAlert.findMany({
      where,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
        acknowledgedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(alerts);
  }),
);

router.patch(
  '/safety-alerts/:id/acknowledge',
  requireRole(...clinicalStaffRoles, Role.ADMIN),
  audit('SAFETY_ALERT_ACKNOWLEDGED', 'MedicationSafetyAlert'),
  asyncHandler(async (req, res) => {
    const alert = await prisma.medicationSafetyAlert.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!alert) throw notFound('Safety alert not found');
    const updated = await prisma.medicationSafetyAlert.update({
      where: { id: String(req.params.id) },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedById: req.user!.id,
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        acknowledgedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.json(updated);
  }),
);

export default router;
