import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/export', requireAuth, asyncHandler(async (_req, res) => {
  res.json({ export: { status: 'ready', format: 'json', generatedAt: new Date().toISOString() } });
}));

router.post('/consent', requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ scope: z.string(), granted: z.boolean() }).parse(req.body);
  res.status(201).json({ consent: { ...body, recordedAt: new Date().toISOString() } });
}));

router.get('/audit', requireAuth, requireRole(Role.ADMIN), asyncHandler(async (_req, res) => {
  res.json({ audit: [], total: 0 });
}));

export default router;
