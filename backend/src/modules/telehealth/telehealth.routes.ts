import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ sessions: [], message: 'Remote telehealth sessions' });
  }),
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ patientId: z.string(), scheduledAt: z.string() }).parse(req.body);
    res.status(201).json({ session: { id: 'new', ...body, status: 'scheduled' } });
  }),
);

export default router;
