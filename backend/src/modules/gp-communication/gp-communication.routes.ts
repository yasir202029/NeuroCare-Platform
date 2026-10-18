import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { GpCommunicationService } from './gp-communication.service.js';
import { notFound } from '../../shared/errors.js';

export function createGpCommunicationRouter(service: GpCommunicationService) {
  const router = Router();
  router.use(requireAuth);

  // Send assessment + medication to GP
  router.post(
    '/send',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const body = z.object({
        patientId: z.string().cuid(),
        clinicianId: z.string().cuid(),
        assessmentId: z.string().cuid().optional(),
        prescriptionId: z.string().cuid().optional(),
        gpName: z.string().min(1),
        gpPractice: z.string().min(1),
        gpEmail: z.string().email().optional(),
        gpNhsNumber: z.string().min(1).optional(),
        communicationType: z.string().min(1),
        subject: z.string().min(1),
        content: z.string().min(1),
        sharedCareAgreementId: z.string().cuid().optional(),
      }).parse(req.body);
      const result = await service.sendToGp(body);
      res.status(201).json(result);
    }),
  );

  // Get patient GP communications
  router.get(
    '/patients/:patientId/communications',
    requireAuth,
    asyncHandler(async (req, res) => {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const communications = await service.getPatientCommunications(patientId);
      res.json(communications);
    }),
  );

  // Get all communications (clinician/admin view)
  router.get(
    '/communications',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const filter = {
        patientId: req.query.patientId as string | undefined,
        status: req.query.status as any,
        gpNhsNumber: req.query.gpNhsNumber as string | undefined,
      };
      const communications = await service.getAllCommunications(filter);
      res.json(communications);
    }),
  );

  // Acknowledge GP communication
  router.post(
    '/communications/:communicationId/acknowledge',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const communicationId = Array.isArray(req.params.communicationId)
        ? req.params.communicationId[0]
        : req.params.communicationId;
      const result = await service.acknowledgeCommunication(
        communicationId,
        req.user!.id,
      );
      res.json(result);
    }),
  );

  // GP submits record update back to clinic
  router.post(
    '/record-updates',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const body = z.object({
        patientId: z.string().cuid(),
        gpCommunicationId: z.string().cuid().optional(),
        gpName: z.string().min(1),
        gpPractice: z.string().min(1),
        gpNhsNumber: z.string().optional(),
        updateType: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        clinicalData: z.record(z.string(), z.unknown()),
        currentValue: z.record(z.string(), z.unknown()).optional(),
        newValue: z.record(z.string(), z.unknown()).optional(),
        requiresClinicianApproval: z.boolean().optional(),
      }).parse(req.body);
      const result = await service.submitRecordUpdate(body);
      res.status(201).json(result);
    }),
  );

  // Get pending record updates
  router.get(
    '/record-updates/pending',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const filter = {
        patientId: req.query.patientId as string | undefined,
        status: req.query.status as any,
        requiresClinicianApproval:
          req.query.requiresClinicianApproval === 'true'
            ? true
            : req.query.requiresClinicianApproval === 'false'
              ? false
              : undefined,
      };
      const updates = await service.getPendingRecordUpdates(filter);
      res.json(updates);
    }),
  );

  // Apply GP record update
  router.post(
    '/record-updates/:updateId/apply',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const updateId = Array.isArray(req.params.updateId)
        ? req.params.updateId[0]
        : req.params.updateId;
      const body = z.object({
        approvalNotes: z.string().optional(),
      }).parse(req.body);
      const result = await service.applyRecordUpdate(updateId, req.user!.id, body.approvalNotes);
      res.json(result);
    }),
  );

  // Reject GP record update
  router.post(
    '/record-updates/:updateId/reject',
    requireRole(Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN),
    asyncHandler(async (req, res) => {
      const updateId = Array.isArray(req.params.updateId)
        ? req.params.updateId[0]
        : req.params.updateId;
      const body = z.object({
        rejectionReason: z.string().min(1),
      }).parse(req.body);
      const result = await service.rejectRecordUpdate(updateId, req.user!.id, body.rejectionReason);
      res.json(result);
    }),
  );

  // Get shared care summary for a patient
  router.get(
    '/patients/:patientId/shared-care-summary',
    requireAuth,
    asyncHandler(async (req, res) => {
      const patientId = Array.isArray(req.params.patientId)
        ? req.params.patientId[0]
        : req.params.patientId;
      const summary = await service.getSharedCareSummary(patientId);
      res.json(summary);
    }),
  );

  return router;
}

export default createGpCommunicationRouter(new GpCommunicationService());
