import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { OnboardingService } from './onboarding.service.js';
import { audit } from '../../middleware/audit.js';
import { notFound } from '../../shared/errors.js';

export function createOnboardingRouter(service: OnboardingService) {
  const router = Router();
  router.use(requireAuth);

  const profileSchema = z.object({
    nhsNumber: z.string().regex(/^\d{10}$/, 'NHS number must be 10 digits').optional(),
    dateOfBirth: z.string().datetime().optional(),
    sexAtBirth: z.string().min(1).max(50).optional(),
    gender: z.string().min(1).max(80).optional(),
    address: z.record(z.string(), z.string()).optional(),
    emergencyContact: z.record(z.string(), z.string()).optional(),
    preferredContact: z.string().max(30).optional(),
    consentToContact: z.boolean().optional(),
    medicalHistory: z.string().max(10000).optional(),
    currentMedication: z.array(z.record(z.string(), z.string())).optional(),
    accessibilityNeeds: z.string().max(2000).optional(),
  });

  const consentSchema = z.object({
    consents: z.array(
      z.object({
        type: z.string().min(1),
        version: z.string().min(1),
        granted: z.boolean(),
        legalBasis: z.string().optional(),
        description: z.string().optional(),
      }),
    ),
  });

  // Get onboarding state
  router.get(
    '/state',
    asyncHandler(async (req, res) => {
      const state = await service.getOnboardingState(req.user!.id);
      res.json(state);
    }),
  );

  // Update profile (progressive)
  router.patch(
    '/profile',
    audit('PATIENT_ONBOARDING_PROFILE_UPDATED', 'Patient'),
    asyncHandler(async (req, res) => {
      const body = profileSchema.parse(req.body);
      const result = await service.updateProfile(req.user!.id, body);
      res.json(result);
    }),
  );

  // Record consents
  router.post(
    '/consents',
    audit('PATIENT_CONSENT_RECORDED', 'ConsentRecord'),
    asyncHandler(async (req, res) => {
      const body = consentSchema.parse(req.body);
      const records = await service.recordConsent(req.user!.id, body.consents);
      res.status(201).json(records);
    }),
  );

  // Get consents
  router.get(
    '/consents',
    asyncHandler(async (req, res) => {
      const records = await service.getConsents(req.user!.id);
      res.json(records);
    }),
  );

  // Complete onboarding
  router.post(
    '/complete',
    audit('PATIENT_ONBOARDING_COMPLETED', 'Patient'),
    asyncHandler(async (req, res) => {
      const result = await service.completeOnboarding(req.user!.id);
      res.json(result);
    }),
  );

  // Get journey steps
  router.get(
    '/journey-steps',
    asyncHandler(async (_req, res) => {
      const steps = await service.getJourneySteps();
      res.json(steps);
    }),
  );

  return router;
}

export default createOnboardingRouter(new OnboardingService());
