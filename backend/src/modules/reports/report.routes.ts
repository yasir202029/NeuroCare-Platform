import { Router } from 'express';
import { AiTransformAction, ReportKind, ReportStatus, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { asyncHandler } from '../../shared/http.js';
import { ReportService } from '../../services/report.service.js';

const router = Router();
const service = new ReportService();
router.use(requireAuth, requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE));

router.get('/templates', asyncHandler(async (_req, res) => { res.json(await service.listTemplates()); }));
router.post('/manual', audit('REPORT_MANUAL_CREATED', 'Report'), asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string().cuid(), assessmentId: z.string().cuid().optional(), kind: z.nativeEnum(ReportKind), title: z.string().trim().min(1).max(200), content: z.string().min(1).max(100000) }).parse(req.body);
  const { content, ...reportInput } = body;
  const clinician = await prisma.clinician.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
  const report = await prisma.report.create({ data: { ...reportInput, clinicianId: clinician?.id, status: ReportStatus.DRAFT, versions: { create: { version: 1, content, createdById: req.user!.id } } } });
  res.status(201).json(report);
}));
router.patch('/:id/content', audit('REPORT_MANUAL_UPDATED', 'Report'), asyncHandler(async (req, res) => {
  const body = z.object({ content: z.string().min(1).max(100000), title: z.string().trim().min(1).max(200).optional() }).parse(req.body);
  const current = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!current) throw new Error('Report not found');
  const nextVersion = current.currentVersion + 1;
  await prisma.reportVersion.create({ data: { reportId: current.id, version: nextVersion, content: body.content, createdById: req.user!.id } });
  res.json(await prisma.report.update({ where: { id: current.id }, data: { currentVersion: nextVersion, status: ReportStatus.DRAFT, ...(body.title ? { title: body.title } : {}) } }));
}));
router.post('/generate', audit('REPORT_GENERATED', 'Report'), asyncHandler(async (req, res) => { const body = z.object({ patientId: z.string().cuid(), assessmentId: z.string().cuid().optional(), kind: z.nativeEnum(ReportKind), title: z.string().min(1).max(200), sourceType: z.enum(['transcript', 'notes', 'text']), sourceText: z.string().min(1).max(100000), templateId: z.string().cuid().optional() }).parse(req.body); res.status(201).json(await service.generate(body, req.user!.id)); }));
router.get('/:id', asyncHandler(async (req, res) => { res.json(await service.get(String(req.params.id))); }));
router.post('/:id/transform', audit('REPORT_TRANSFORMED', 'Report'), asyncHandler(async (req, res) => { const body = z.object({ action: z.nativeEnum(AiTransformAction), tone: z.string().max(80).optional() }).parse(req.body); res.json(await service.transform(String(req.params.id), body.action, req.user!.id, body.tone)); }));
router.get('/:id/compare', asyncHandler(async (req, res) => { const query = z.object({ left: z.coerce.number().int().positive(), right: z.coerce.number().int().positive() }).parse(req.query); res.json(await service.compare(String(req.params.id), query.left, query.right)); }));
router.post('/:id/approve', audit('REPORT_APPROVED', 'Report'), asyncHandler(async (req, res) => { res.json(await service.approve(String(req.params.id), req.user!.id)); }));
export default router;
