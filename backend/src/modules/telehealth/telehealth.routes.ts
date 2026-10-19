import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, clinicalStaffRoles } from '../../middleware/auth.js';
import { requirePatientAccess } from '../../middleware/patient-authz.js';
import { asyncHandler } from '../../shared/http.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (_req, res) => {
    res.json({ sessions: [], message: 'Remote telehealth sessions' });
  }),
);

router.post(
  '/',
  requireAuth,
  requirePatientAccess('body'),
  asyncHandler(async (req, res) => {
    const body = z.object({ patientId: z.string(), scheduledAt: z.string() }).parse(req.body);
    res.status(201).json({ session: { id: 'new', ...body, status: 'scheduled' } });
  }),
);

export default router;
