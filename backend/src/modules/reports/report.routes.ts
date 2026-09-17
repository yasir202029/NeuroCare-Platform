import { Router } from 'express';
import { AiTransformAction, ReportKind, Role } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { asyncHandler } from '../../shared/http.js';
import { ReportService } from '../../services/report.service.js';

const router = Router();
const service = new ReportService();
router.use(requireAuth, requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE));

router.get('/templates', asyncHandler(async (_req, res) => { res.json(await service.listTemplates()); }));
router.post('/generate', audit('REPORT_GENERATED', 'Report'), asyncHandler(async (req, res) => { const body = z.object({ patientId: z.string().cuid(), assessmentId: z.string().cuid().optional(), kind: z.nativeEnum(ReportKind), title: z.string().min(1).max(200), sourceType: z.enum(['transcript', 'notes', 'text']), sourceText: z.string().min(1).max(100000), templateId: z.string().cuid().optional() }).parse(req.body); res.status(201).json(await service.generate(body, req.user!.id)); }));
router.get('/:id', asyncHandler(async (req, res) => { res.json(await service.get(String(req.params.id))); }));
router.post('/:id/transform', audit('REPORT_TRANSFORMED', 'Report'), asyncHandler(async (req, res) => { const body = z.object({ action: z.nativeEnum(AiTransformAction), tone: z.string().max(80).optional() }).parse(req.body); res.json(await service.transform(String(req.params.id), body.action, req.user!.id, body.tone)); }));
router.get('/:id/compare', asyncHandler(async (req, res) => { const query = z.object({ left: z.coerce.number().int().positive(), right: z.coerce.number().int().positive() }).parse(req.query); res.json(await service.compare(String(req.params.id), query.left, query.right)); }));
router.post('/:id/approve', audit('REPORT_APPROVED', 'Report'), asyncHandler(async (req, res) => { res.json(await service.approve(String(req.params.id), req.user!.id)); }));
export default router;
