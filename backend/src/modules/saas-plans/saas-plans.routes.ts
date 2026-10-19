import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ plans: [{ id: 'starter', name: 'Starter', price: 49 }, { id: 'pro', name: 'Pro', price: 149 }] });
  }),
);

router.post(
  '/subscribe',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ planId: z.string() }).parse(req.body);
    res.status(201).json({ subscription: { id: 'sub_new', planId: body.planId, status: 'active' } });
  }),
);

export default router;
