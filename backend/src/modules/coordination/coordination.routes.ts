import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { ServiceCoordinationService } from './coordination.service.js';
import { notFound } from '../../shared/errors.js';

export function createCoordinationRouter(service: ServiceCoordinationService) {
  const router = Router();
  router.use(requireAuth);

  // Register module health
  router.post(
    '/modules/health',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const body = z.object({
        module: z.string().min(1),
        serviceName: z.string().min(1),
        status: z.enum(['HEALTHY', 'DEGRADED', 'DOWN', 'MAINTENANCE']),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }).parse(req.body);
      const record = await service.registerModule(
        body.module,
        body.serviceName,
        body.status,
        body.metadata,
      );
      res.status(201).json(record);
    }),
  );

  // Get all module health
  router.get(
    '/modules/health',
    asyncHandler(async (_req, res) => {
      const health = await service.getAllModuleHealth();
      res.json(health);
    }),
  );

  // Get specific module health
  router.get(
    '/modules/health/:module/:serviceName',
    asyncHandler(async (req, res) => {
      const module = Array.isArray(req.params.module) ? req.params.module[0] : req.params.module;
      const serviceName = Array.isArray(req.params.serviceName) ? req.params.serviceName[0] : req.params.serviceName;
      const health = await service.getModuleHealth(module, serviceName);
      if (!health) throw notFound('Module health not found');
      res.json(health);
    }),
  );

  // Get unhealthy modules
  router.get(
    '/modules/unhealthy',
    asyncHandler(async (_req, res) => {
      const unhealthy = await service.getUnhealthyModules();
      res.json(unhealthy);
    }),
  );

  // Coordination summary
  router.get(
    '/summary',
    asyncHandler(async (_req, res) => {
      const summary = await service.getCoordinationSummary();
      res.json(summary);
    }),
  );

  // Emit cross-module event
  router.post(
    '/events/emit',
    requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
    asyncHandler(async (req, res) => {
      const body = z.object({
        eventType: z.string().min(1),
        sourceModule: z.string().min(1),
        targetModule: z.string().optional(),
        patientId: z.string().cuid().optional(),
        actorId: z.string().cuid().optional(),
        payload: z.record(z.string(), z.unknown()).default({}),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
      }).parse(req.body);
      const result = await service.emitCrossModuleEvent({
        eventType: body.eventType,
        sourceModule: body.sourceModule,
        targetModule: body.targetModule,
        patientId: body.patientId,
        actorId: body.actorId,
        payload: body.payload,
        priority: body.priority,
      });
      res.status(201).json(result);
    }),
  );

  return router;
}

export default createCoordinationRouter(new ServiceCoordinationService());
