import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { Role } from '@prisma/client';

const router = Router();

// Data Subject Access Request (SAR) - UK GDPR Art. 15
router.get('/sar/:subjectId', requireAuth, asyncHandler(async (req, res) => {
  res.json({
    subjectId: req.params.subjectId,
    data: { profile: {}, clinical: [], audit: [] },
    exportedAt: new Date().toISOString(),
    format: 'json',
  });
}));

// Right to erasure (UK GDPR Art. 17)
router.delete('/erasure/:subjectId', requireAuth, requireRole(Role.ADMIN), asyncHandler(async (req, res) => {
  res.json({ subjectId: req.params.subjectId, status: 'scheduled', scheduledAt: new Date().toISOString() });
}));

// Right to rectification (Art. 16)
router.patch('/rectify/:subjectId', requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ field: z.string(), value: z.unknown() }).parse(req.body);
  res.json({ subjectId: req.params.subjectId, updated: body, updatedAt: new Date().toISOString() });
}));

// Right to data portability (Art. 20)
router.get('/portability/:subjectId', requireAuth, asyncHandler(async (req, res) => {
  res.json({ subjectId: req.params.subjectId, format: 'json', downloadUrl: null });
}));

// Consent management
router.get('/consent/:subjectId', requireAuth, asyncHandler(async (req, res) => {
  res.json({ subjectId: req.params.subjectId, consents: [] });
}));

router.post('/consent', requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ subjectId: z.string(), scope: z.string(), granted: z.boolean(), lawfulBasis: z.string().optional() }).parse(req.body);
  res.status(201).json({ consent: { ...body, recordedAt: new Date().toISOString() } });
}));

// Records of processing activities (Art. 30)
router.get('/ropa', requireAuth, requireRole(Role.ADMIN), asyncHandler(async (_req, res) => {
  res.json({ records: [], controller: 'NeuroCare Platform', dpo: null });
}));

// Data breach log (Art. 33/34)
router.get('/breaches', requireAuth, requireRole(Role.ADMIN), asyncHandler(async (_req, res) => {
  res.json({ breaches: [] });
}));

router.post('/breaches', requireAuth, requireRole(Role.ADMIN), asyncHandler(async (req, res) => {
  const body = z.object({ description: z.string(), severity: z.string(), affectedCount: z.number() }).parse(req.body);
  res.status(201).json({ breach: { ...body, reportedAt: new Date().toISOString(), notifiedIco: false } });
}));

// Data retention policy
router.get('/retention', requireAuth, asyncHandler(async (_req, res) => {
  res.json({ policy: { clinical: '8 years', audit: '7 years', consent: 'duration+6 years' } });
}));

// DPIA register
router.get('/dpia', requireAuth, requireRole(Role.ADMIN), asyncHandler(async (_req, res) => {
  res.json({ assessments: [] });
}));

export default router;
