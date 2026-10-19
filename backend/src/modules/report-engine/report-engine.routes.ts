import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';

const REPORT_ENGINE_URL = process.env.REPORT_ENGINE_URL || 'http://report-engine:8000';

const router = Router();

router.post('/generate', requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string(), type: z.string(), data: z.record(z.string(), z.unknown()).optional() }).parse(req.body);
  const r = await fetch(`${REPORT_ENGINE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  res.status(r.status).json(data);
}));

router.get('/templates', requireAuth, asyncHandler(async (_req, res) => {
  const r = await fetch(`${REPORT_ENGINE_URL}/templates`);
  const data = await r.json();
  res.status(r.status).json(data);
}));

export default router;
