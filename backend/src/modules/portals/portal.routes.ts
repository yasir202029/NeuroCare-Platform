import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requirePortal, portalsForRoles, type PortalName } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { prisma } from '../../shared/db.js';
import { badRequest } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);
router.get('/access', asyncHandler(async (req, res) => {
  const permissions = await prisma.rolePermission.findMany({ where: { role: { in: req.user!.roles } }, include: { permission: { select: { code: true, description: true } } } });
  res.json({ roles: req.user!.roles, portals: portalsForRoles(req.user!.roles), permissions: permissions.map((item) => item.permission) });
}));
router.get('/:portal/summary', asyncHandler(async (req, res, next) => {
  const portal = String(req.params.portal) as PortalName;
  if (!['patient', 'clinician', 'admin', 'finance', 'prescriber', 'nurse'].includes(portal)) return next(badRequest('Unknown portal'));
  return requirePortal(portal)(req, res, async (error) => {
    if (error) return next(error);
    const summaries: Record<PortalName, unknown> = {
      patient: { appointments: await prisma.appointment.count({ where: { patient: { userId: req.user!.id } } }), reports: await prisma.report.count({ where: { patient: { userId: req.user!.id }, status: { in: ['APPROVED', 'SHARED'] } } }) },
      clinician: { patients: await prisma.patient.count({ where: { assessments: { some: { clinician: { userId: req.user!.id } } } } }), pendingReports: await prisma.report.count({ where: { clinician: { userId: req.user!.id }, status: 'REVIEW_REQUIRED' } }) },
      admin: { users: await prisma.user.count(), patients: await prisma.patient.count(), appointments: await prisma.appointment.count(), auditEvents: await prisma.auditEvent.count() },
      finance: { invoices: await prisma.invoice.count(), outstandingPence: (await prisma.invoice.aggregate({ where: { status: { in: ['OPEN', 'OVERDUE'] } }, _sum: { totalPence: true } }))._sum.totalPence ?? 0, payments: await prisma.payment.count() },
      prescriber: { prescriptionsToReview: await prisma.prescription.count({ where: { status: 'PENDING_SIGNATURE' } }), physicalReviews: await prisma.physicalHealthReview.count({ where: { clinician: { userId: req.user!.id } } }) },
      nurse: { physicalReviews: await prisma.physicalHealthReview.count({ where: { clinician: { userId: req.user!.id } } }), openAlerts: await prisma.physicalHealthAlert.count({ where: { acknowledgedAt: null } }) },
    };
    res.json({ portal, summary: summaries[portal] });
  });
}));
export default router;
