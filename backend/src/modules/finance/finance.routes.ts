import { Router } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { FinanceService } from '../../services/finance.service.js';

const router = Router();
const service = new FinanceService();
router.use(requireAuth);
router.get('/dashboard', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (_req, res) => { res.json(await service.dashboard()); }));
router.get('/revenue/clinicians', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (req, res) => { const query = z.object({ from: z.coerce.date(), to: z.coerce.date() }).parse(req.query); res.json(await service.revenueByClinician(query.from, query.to)); }));
router.get('/revenue/services', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (req, res) => { const query = z.object({ from: z.coerce.date(), to: z.coerce.date() }).parse(req.query); res.json(await service.revenueByService(query.from, query.to)); }));
router.get('/analytics', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (req, res) => { const query = z.object({ from: z.coerce.date(), to: z.coerce.date() }).parse(req.query); res.json(await service.analytics(query.from, query.to)); }));
router.get('/earnings/me', requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), asyncHandler(async (req, res) => { res.json(await service.clinicianEarnings(req.user!.id)); }));
router.post('/kpis/snapshot', requireRole(Role.ADMIN, Role.FINANCE), asyncHandler(async (_req, res) => { res.json(await service.recordKpis()); }));
export default router;
