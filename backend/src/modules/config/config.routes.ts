import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { configService } from './config.service.js';
import { notFound } from '../../shared/errors.js';

const router = Router();

/** Public: flags safe to expose to the browser. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const flags = await configService.getPublicFlags();
    res.json({ flags });
  }),
);

/** Admin: list every flag. */
router.get(
  '/admin',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (_req, res) => {
    const flags = await configService.listFlags();
    res.json({ flags });
  }),
);

/** Admin: get a single flag. */
router.get(
  '/admin/:key',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const flag = await configService.getFlag(String(req.params.key));
    res.json({ flag });
  }),
);

/** Admin: create or update a flag. */
router.put(
  '/admin/:key',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        enabled: z.boolean().optional(),
        rolloutPct: z.coerce.number().int().min(0).max(100).optional(),
      })
      .parse(req.body);
    const flag = await configService.upsertFlag(String(req.params.key), body);
    res.json({ flag });
  }),
);

/** Admin: delete a flag. */
router.delete(
  '/admin/:key',
  requireAuth,
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    await configService.deleteFlag(String(req.params.key));
    res.json({ ok: true });
  }),
);

/** Check whether a flag is enabled for the current user. */
router.get(
  '/check/:key',
  requireAuth,
  asyncHandler(async (req, res) => {
    const enabled = await configService.isEnabled(String(req.params.key), req.user!.id);
    res.json({ key: String(req.params.key), enabled });
  }),
);

export default router;