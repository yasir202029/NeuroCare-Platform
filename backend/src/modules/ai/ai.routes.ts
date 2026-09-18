import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { AiService } from '../../services/ai.service.js';

const router = Router();
const service = new AiService();
router.use(requireAuth, requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN));
router.post('/report-draft', asyncHandler(async (req, res) => { const body = z.object({ assessmentType: z.string(), clinicalFacts: z.string().min(1).max(50000), recommendations: z.string().max(20000).optional() }).parse(req.body); res.json(await service.draftClinicalReport(body)); }));
router.post('/summarise', asyncHandler(async (req, res) => { const body = z.object({ text: z.string().min(1).max(50000) }).parse(req.body); res.json(await service.summarise(body.text)); }));
router.post('/copilot', asyncHandler(async (req, res) => { const body = z.object({ action: z.enum(['LISTEN', 'NOTES', 'ADHD_REPORT', 'ASD_REPORT', 'GP_LETTER', 'SHARED_CARE_LETTER', 'REWRITE', 'SHORTEN', 'EXPAND', 'IMPROVE_WORDING']), text: z.string().min(1).max(50000) }).parse(req.body); const kind = body.action.replaceAll('_', ' '); const result = ['SHORTEN', 'REWRITE', 'IMPROVE_WORDING'].includes(body.action) ? await service.summarise(body.text) : await service.draftClinicalReport({ assessmentType: kind, clinicalFacts: body.text }); res.json({ action: body.action, content: 'content' in result ? result.content : result.summary, requiresReview: true }); }));
export default router;
