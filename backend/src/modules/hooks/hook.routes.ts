import { Router } from 'express';
import { z } from 'zod';
import { Role, HookEvent, HookStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { HookService, registerInternalHookHandler } from './hook.service.js';
import { notFound } from '../../shared/errors.js';

export function createHookRouter(service: HookService) {
  const router = Router();
  router.use(requireAuth);

  // Create hook
  router.post(
    '/',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const body = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        event: z.nativeEnum(HookEvent),
        targetUrl: z.string().url().optional(),
        secret: z.string().optional(),
        isInternal: z.boolean().optional(),
        handlerName: z.string().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        retryCount: z.number().int().min(1).max(10).optional(),
        timeoutMs: z.number().int().min(100).max(30000).optional(),
      }).parse(req.body);
      const hook = await service.createHook({
        ...body,
        createdById: req.user!.id,
      });
      res.status(201).json(hook);
    }),
  );

  // Get all hooks
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const filter = {
        event: req.query.event as HookEvent | undefined,
        status: req.query.status as HookStatus | undefined,
      };
      const hooks = await service.getHooks(filter);
      res.json(hooks);
    }),
  );

  // Get hook by ID
  router.get(
    '/:hookId',
    asyncHandler(async (req, res) => {
      const hookId = Array.isArray(req.params.hookId)
        ? req.params.hookId[0]
        : req.params.hookId;
      const hook = await service.getHook(hookId);
      res.json(hook);
    }),
  );

  // Update hook status
  router.patch(
    '/:hookId/status',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const hookId = Array.isArray(req.params.hookId)
        ? req.params.hookId[0]
        : req.params.hookId;
      const body = z.object({
        status: z.nativeEnum(HookStatus),
      }).parse(req.body);
      const hook = await service.updateHookStatus(hookId, body.status);
      res.json(hook);
    }),
  );

  // Execute a hook manually
  router.post(
    '/:hookId/execute',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const hookId = Array.isArray(req.params.hookId)
        ? req.params.hookId[0]
        : req.params.hookId;
      const body = z.object({
        event: z.nativeEnum(HookEvent),
        payload: z.record(z.string(), z.unknown()).default({}),
      }).parse(req.body);
      const execution = await service.executeHook(hookId, body.event, body.payload);
      res.status(201).json(execution);
    }),
  );

  // Get hook executions
  router.get(
    '/executions',
    asyncHandler(async (req, res) => {
      const filter = {
        hookId: req.query.hookId as string | undefined,
        event: req.query.event as HookEvent | undefined,
        status: req.query.status as string | undefined,
      };
      const executions = await service.getExecutions(filter);
      res.json(executions);
    }),
  );

  // Trigger event hooks (trigger all active hooks for an event)
  router.post(
    '/events/:event/trigger',
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const event = Array.isArray(req.params.event)
        ? req.params.event[0]
        : req.params.event;
      const body = z.object({
        payload: z.record(z.string(), z.unknown()).default({}),
      }).parse(req.body);
      const results = await service.triggerEventHooks(event as HookEvent, body.payload);
      res.json({ event, results, count: results.length });
    }),
  );

  return router;
}

export default createHookRouter(new HookService());
