import { Router } from 'express';
import { z } from 'zod';
import { Role, RailSeverity, RailAction, RailScope, HookEvent } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { RailService } from './rail.service.js';
import { notFound } from '../../shared/errors.js';

export function createRailRouter(service: RailService, hookService?: any) {
  const router = Router();
  router.use(requireAuth);

  // Create rail
  router.post(
    '/',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const body = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        event: z.nativeEnum(HookEvent),
        scope: z.nativeEnum(RailScope),
        scopeValue: z.string().optional(),
        severity: z.nativeEnum(RailSeverity),
        action: z.nativeEnum(RailAction),
        condition: z.record(z.string(), z.unknown()),
        createdById: z.string().cuid(),
      }).parse(req.body);
      const rail = await service.createRail({
        ...body,
        createdById: body.createdById,
      });
      res.status(201).json(rail);
    }),
  );

  // Get all rails
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const filter = {
        event: req.query.event as HookEvent | undefined,
        scope: req.query.scope as RailScope | undefined,
        isEnabled: req.query.isEnabled === 'true' ? true : req.query.isEnabled === 'false' ? false : undefined,
      };
      const rails = await service.getRails(filter);
      res.json(rails);
    }),
  );

  // Get rail by ID
  router.get(
    '/:railId',
    asyncHandler(async (req, res) => {
      const railId = Array.isArray(req.params.railId)
        ? req.params.railId[0]
        : req.params.railId;
      const rail = await service.getRail(railId);
      res.json(rail);
    }),
  );

  // Update rail
  router.patch(
    '/:railId',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const railId = Array.isArray(req.params.railId)
        ? req.params.railId[0]
        : req.params.railId;
      const body = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        severity: z.nativeEnum(RailSeverity).optional(),
        action: z.nativeEnum(RailAction).optional(),
        condition: z.record(z.string(), z.unknown()).optional(),
        isEnabled: z.boolean().optional(),
      }).parse(req.body);
      const rail = await service.updateRail(railId, body);
      res.json(rail);
    }),
  );

  // Delete rail
  router.delete(
    '/:railId',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const railId = Array.isArray(req.params.railId)
        ? req.params.railId[0]
        : req.params.railId;
      await service.deleteRail(railId);
      res.json({ deleted: true });
    }),
  );

  // Evaluate rails for an event
  router.post(
    '/evaluate',
    requireAuth,
    asyncHandler(async (req, res) => {
      const body = z.object({
        event: z.nativeEnum(HookEvent),
        patientId: z.string().cuid().optional(),
        actorId: z.string().cuid().optional(),
        role: z.string().optional(),
        organizationId: z.string().optional(),
        data: z.record(z.string(), z.unknown()),
      }).parse(req.body);
      const result = await service.evaluateRails(body.event, {
        patientId: body.patientId,
        actorId: body.actorId,
        role: body.role,
        organizationId: body.organizationId,
        data: body.data,
      });

      // If blocked, return 403
      if (result.blocked) {
        res.status(403).json({
          blocked: true,
          violations: result.violations,
          warnings: result.warnings,
          message: 'Action blocked by rail guardrail',
        });
        return;
      }

      res.json(result);
    }),
  );

  // Get violations
  router.get(
    '/violations',
    asyncHandler(async (req, res) => {
      const filter = {
        patientId: req.query.patientId as string | undefined,
        resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
        severity: req.query.severity as RailSeverity | undefined,
      };
      const violations = await service.getViolations(filter);
      res.json(violations);
    }),
  );

  // Resolve violation
  router.post(
    '/violations/:violationId/resolve',
    requireAuth,
    asyncHandler(async (req, res) => {
      const violationId = Array.isArray(req.params.violationId)
        ? req.params.violationId[0]
        : req.params.violationId;
      const body = z.object({
        resolutionNote: z.string().optional(),
      }).parse(req.body);
      const violation = await service.resolveViolation(violationId, req.user!.id, body.resolutionNote);
      res.json(violation);
    }),
  );

  // Get rail stats
  router.get(
    '/stats',
    asyncHandler(async (_req, res) => {
      const stats = await service.getRailStats();
      res.json(stats);
    }),
  );

  return router;
}

export default createRailRouter(new RailService());
