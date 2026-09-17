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
export default router;
