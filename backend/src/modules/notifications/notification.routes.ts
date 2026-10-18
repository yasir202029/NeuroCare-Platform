import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { audit } from '../../middleware/audit.js';
import { notFound, forbidden } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);

/** List notifications for the current user. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        unreadOnly: z.coerce.boolean().optional(),
        take: z.coerce.number().int().min(1).max(100).default(50),
        skip: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id, ...(query.unreadOnly ? { readAt: null } : {}) },
      orderBy: [{ createdAt: 'desc' }],
      take: query.take,
      skip: query.skip,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, readAt: null },
    });

    res.json({ notifications, unreadCount });
  }),
);

/** Mark a notification as read. */
router.patch(
  '/:id/read',
  audit('NOTIFICATION_READ', 'Notification'),
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
    });
    if (!notification) throw notFound('Notification not found');

    const updated = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { readAt: new Date() },
    });
    res.json(updated);
  }),
);

/** Mark all notifications as read. */
router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  }),
);

/** Create a notification (admin/system). */
router.post(
  '/',
  requireRole(Role.ADMIN),
  audit('NOTIFICATION_CREATED', 'Notification'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        userId: z.string().cuid(),
        type: z.nativeEnum(Role).optional(),
        title: z.string().min(1).max(200),
        body: z.string().min(1).max(5000),
      })
      .parse(req.body);

    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        type: "APPOINTMENT_REMINDER",
        title: body.title,
        body: body.body,
      },
    });
    res.status(201).json(notification);
  }),
);

export default router;