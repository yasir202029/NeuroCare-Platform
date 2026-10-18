import { Router } from 'express';
import { z } from 'zod';
import { Role, ReportStatus, ReportSignatureStatus, NextStepType, NextStepStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { ReportSignatureService } from './report-signature.service.js';
import { audit } from '../../middleware/audit.js';
import { notFound } from '../../shared/errors.js';

export function createReportLifecycleRouter(service: ReportSignatureService) {
  const router = Router();
  router.use(requireAuth);

  // Sign a report
  router.post(
    '/reports/:reportId/sign',
    requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
    audit('REPORT_SIGNED', 'ReportSignature'),
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const body = z.object({
        method: z.enum(['DIGITAL', 'BIOMETRIC', 'SMART_CARD', 'TOTP_VERIFIED']).optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        mfaVerified: z.boolean().optional(),
      }).parse(req.body);
      const result = await service.signReport({
        reportId,
        signerId: req.user!.id,
        method: body.method,
        ipAddress: body.ipAddress,
        userAgent: body.userAgent,
        mfaVerified: body.mfaVerified,
      });
      res.status(201).json(result);
    }),
  );

  // Revoke a signature
  router.delete(
    '/reports/:reportId/signatures/:signatureId/revoke',
    requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
    audit('REPORT_SIGNATURE_REVOKED', 'ReportSignature'),
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const signatureId = Array.isArray(req.params.signatureId) ? req.params.signatureId[0] : req.params.signatureId;
      const result = await service.revokeSignature(signatureId, req.user!.id);
      res.json({ reportId, signature: result });
    }),
  );

  // Get signatures for a report
  router.get(
    '/reports/:reportId/signatures',
    requireAuth,
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const signatures = await service.getSignatures(reportId);
      res.json(signatures);
    }),
  );

  // Share a report
  router.post(
    '/reports/:reportId/share',
    requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
    audit('REPORT_SHARED', 'ReportShare'),
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const body = z.object({
        patientId: z.string().cuid(),
        purpose: z.enum(['PATIENT_VIEW', 'CLINICIAN_REVIEW', 'GP_SHARED_CARE', 'SCHOOL_REFERRAL', 'EMPLOYER_ADJUSTMENT', 'LEGAL_REQUEST', 'RESEARCH_ANONYMISED']),
        sharedWithId: z.string().cuid().optional(),
        accessExpiresAt: z.string().datetime().optional(),
        message: z.string().optional(),
      }).parse(req.body);
      const result = await service.shareReport({
        reportId,
        sharedById: req.user!.id,
        patientId: body.patientId,
        purpose: body.purpose,
        sharedWithId: body.sharedWithId,
        accessExpiresAt: body.accessExpiresAt,
        message: body.message,
      });
      res.status(201).json(result);
    }),
  );

  // Get shares for a report
  router.get(
    '/reports/:reportId/shares',
    requireAuth,
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const shares = await service.getShares(reportId);
      res.json(shares);
    }),
  );

  // Revoke a share
  router.delete(
    '/reports/shares/:shareId/revoke',
    requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
    audit('REPORT_SHARE_REVOKED', 'ReportShare'),
    asyncHandler(async (req, res) => {
      const shareId = Array.isArray(req.params.shareId) ? req.params.shareId[0] : req.params.shareId;
      const result = await service.revokeShare(shareId, req.user!.id);
      res.json(result);
    }),
  );

  // Access report via share token (public endpoint for patients/external recipients)
  router.get(
    '/reports/share/:accessToken',
    requireAuth,
    asyncHandler(async (req, res) => {
      const accessToken = Array.isArray(req.params.accessToken) ? req.params.accessToken[0] : req.params.accessToken;
      const body = z.object({
        action: z.enum(['VIEW', 'DOWNLOAD', 'PRINT', 'SHARE']).default('VIEW'),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      }).parse(req.query);
      const result = await service.accessReportByToken(
        accessToken,
        req.user!.id,
        body.action,
        body.ipAddress,
        body.userAgent,
      );
      res.json(result);
    }),
  );

  // Create next step
  router.post(
    '/reports/:reportId/next-steps',
    requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
    audit('REPORT_NEXT_STEP_CREATED', 'ReportNextStep'),
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const body = z.object({
        patientId: z.string().cuid(),
        type: z.nativeEnum(NextStepType),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        scheduledAt: z.string().datetime().optional(),
        clinicianId: z.string().cuid().optional(),
      }).parse(req.body);
      const result = await service.createNextStep({
        reportId,
        patientId: body.patientId,
        type: body.type,
        title: body.title,
        description: body.description,
        scheduledAt: body.scheduledAt,
        clinicianId: body.clinicianId,
        createdById: req.user!.id,
      });
      res.status(201).json(result);
    }),
  );

  // Get next steps for a report
  router.get(
    '/reports/:reportId/next-steps',
    requireAuth,
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const nextSteps = await service.getNextSteps(reportId);
      res.json(nextSteps);
    }),
  );

  // Update next step status
  router.patch(
    '/reports/next-steps/:nextStepId/status',
    requireAuth,
    audit('REPORT_NEXT_STEP_UPDATED', 'ReportNextStep'),
    asyncHandler(async (req, res) => {
      const nextStepId = Array.isArray(req.params.nextStepId) ? req.params.nextStepId[0] : req.params.nextStepId;
      const body = z.object({
        status: z.nativeEnum(NextStepStatus),
        completedById: z.string().cuid().optional(),
      }).parse(req.body);
      const result = await service.updateNextStepStatus(nextStepId, body.status, body.completedById);
      res.json(result);
    }),
  );

  // Get full report lifecycle
  router.get(
    '/reports/:reportId/lifecycle',
    requireAuth,
    asyncHandler(async (req, res) => {
      const reportId = Array.isArray(req.params.reportId) ? req.params.reportId[0] : req.params.reportId;
      const lifecycle = await service.getReportLifecycle(reportId);
      res.json(lifecycle);
    }),
  );

  // Get pending signatures for current user
  router.get(
    '/reports/pending-signatures',
    requireAuth,
    asyncHandler(async (req, res) => {
      const signatures = await service.getPendingSignatures(req.user!.id);
      res.json(signatures);
    }),
  );

  // Get pending next steps for current patient
  router.get(
    '/reports/pending-next-steps',
    requireAuth,
    asyncHandler(async (req, res) => {
      // For patient role, use their patientId; for clinical staff, they might want to see all
      const patientId = req.query.patientId as string | undefined;
      const targetPatientId = patientId ?? req.user!.id;
      const nextSteps = await service.getPendingNextSteps(targetPatientId);
      res.json(nextSteps);
    }),
  );

  return router;
}

export default createReportLifecycleRouter(new ReportSignatureService());
