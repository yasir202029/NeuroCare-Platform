import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { SaaSService } from '../../services/saas.service.js';
import { audit } from '../../middleware/audit.js';
import { notFound } from '../../shared/errors.js';

const router = Router();
const service = new SaaSService();
router.use(requireAuth);

// Plans (public read, admin write)
router.get('/plans', asyncHandler(async (_req, res) => {
  res.json(await service.listPlans());
}));

router.post(
  '/plans',
  requireRole(Role.ADMIN),
  audit('SAAS_PLAN_CREATED', 'SubscriptionPlan'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      key: z.string().min(1).max(100),
      name: z.string().min(1).max(200),
      tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
      description: z.string().optional(),
      pricePence: z.number().int().positive(),
      interval: z.enum(['MONTHLY', 'ANNUAL']),
      features: z.record(z.string(), z.unknown()).optional(),
      limits: z.record(z.string(), z.unknown()).optional(),
    }).parse(req.body);
    res.json(await service.createPlan(body));
  }),
);

// Organization
router.get(
  '/org/:orgId',
  asyncHandler(async (req, res) => {
    const org = await service.getOrganization(String(req.params.orgId));
    res.json(org);
  }),
);

router.patch(
  '/org/:orgId',
  requireRole(Role.ADMIN),
  audit('SAAS_ORG_UPDATED', 'Organization'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      name: z.string().min(1).max(200).optional(),
      tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
      branding: z.record(z.string(), z.unknown()).optional(),
      settings: z.record(z.string(), z.unknown()).optional(),
    }).parse(req.body);
    res.json(await service.updateOrganization(String(req.params.orgId), body));
  }),
);

// Organization members
router.get(
  '/org/:orgId/members',
  asyncHandler(async (req, res) => {
    const org = await service.getOrganization(String(req.params.orgId));
    res.json(org.members);
  }),
);

router.post(
  '/org/:orgId/members',
  requireRole(Role.ADMIN),
  audit('SAAS_MEMBER_ADDED', 'OrganizationMember'),
  asyncHandler(async (req, res) => {
    const body = z.object({ userId: z.string().cuid(), role: z.string().optional() }).parse(req.body);
    res.json(await service.addMember(String(req.params.orgId), body));
  }),
);

router.delete(
  '/org/:orgId/members/:userId',
  requireRole(Role.ADMIN),
  audit('SAAS_MEMBER_REMOVED', 'OrganizationMember'),
  asyncHandler(async (req, res) => {
    res.json(await service.removeMember(String(req.params.orgId), String(req.params.userId)));
  }),
);

// Usage metering
router.post(
  '/usage',
  asyncHandler(async (req, res) => {
    const body = z.object({ orgId: z.string().cuid(), metric: z.string(), count: z.number().int().nonnegative().optional(), period: z.string().optional() }).parse(req.body);
    res.json(await service.recordUsage(body.orgId, { metric: body.metric, count: body.count, period: body.period }));
  }),
);

router.get(
  '/usage/:orgId',
  asyncHandler(async (req, res) => {
    res.json(await service.getUsage(String(req.params.orgId)));
  }),
);

// API keys
router.post(
  '/api-keys',
  requireRole(Role.ADMIN),
  audit('SAAS_API_KEY_CREATED', 'ApiKey'),
  asyncHandler(async (req, res) => {
    const body = z.object({ orgId: z.string().cuid(), name: z.string().min(1), scopes: z.array(z.string()).optional(), expiresInDays: z.number().int().positive().optional() }).parse(req.body);
    res.json(await service.createApiKey(body.orgId, body));
  }),
);

router.get(
  '/api-keys/:orgId',
  asyncHandler(async (req, res) => {
    res.json(await service.listApiKeys(String(req.params.orgId)));
  }),
);

router.delete(
  '/api-keys/:orgId/:keyId',
  requireRole(Role.ADMIN),
  audit('SAAS_API_KEY_REVOKED', 'ApiKey'),
  asyncHandler(async (req, res) => {
    res.json(await service.revokeApiKey(String(req.params.orgId), String(req.params.keyId)));
  }),
);

// Feature flags
router.get(
  '/feature-flags',
  asyncHandler(async (_req, res) => {
    res.json(await service.listFeatureFlags());
  }),
);

router.post(
  '/feature-flags',
  requireRole(Role.ADMIN),
  audit('SAAS_FEATURE_FLAG_SET', 'FeatureFlag'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      key: z.string().min(1).max(100),
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      enabled: z.boolean().optional(),
      rolloutPct: z.number().int().min(0).max(100).optional(),
      conditions: z.record(z.string(), z.unknown()).optional(),
    }).parse(req.body);
    res.json(await service.setFeatureFlag(body));
  }),
);

router.get(
  '/feature-flags/:key/check',
  asyncHandler(async (req, res) => {
    const orgId = req.query.orgId as string | undefined;
    res.json(await service.checkFeatureFlag(String(req.params.key), orgId));
  }),
);

// Trial
router.post(
  '/trial',
  requireRole(Role.ADMIN),
  audit('SAAS_TRIAL_STARTED', 'TrialRecord'),
  asyncHandler(async (req, res) => {
    const body = z.object({ orgId: z.string().cuid(), tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']) }).parse(req.body);
    res.json(await service.startTrial(body.orgId, body));
  }),
);

router.get(
  '/trial/:orgId',
  asyncHandler(async (req, res) => {
    res.json(await service.getTrial(String(req.params.orgId)));
  }),
);

export default router;
