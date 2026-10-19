import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';

const AI_URL = process.env.CLINICAL_AI_URL || 'http://clinical-ai:8001';

const router = Router();

router.post('/draft-report', requireAuth, asyncHandler(async (req, res) => {
  const r = await fetch(`${AI_URL}/draft-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
  res.status(r.status).json(await r.json());
}));

router.post('/validate-prescription', requireAuth, asyncHandler(async (req, res) => {
  const r = await fetch(`${AI_URL}/validate-prescription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
  res.status(r.status).json(await r.json());
}));

router.post('/summarise-note', requireAuth, asyncHandler(async (req, res) => {
  const r = await fetch(`${AI_URL}/summarise-note`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
  res.status(r.status).json(await r.json());
}));

router.get('/pathway/:patientId', requireAuth, asyncHandler(async (req, res) => {
  const r = await fetch(`${AI_URL}/pathway/${req.params.patientId}`);
  res.status(r.status).json(await r.json());
}));

export default router;
