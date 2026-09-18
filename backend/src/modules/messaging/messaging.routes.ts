import { Router } from 'express';
import { z } from 'zod';
import { MessageChannel, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { audit } from '../../middleware/audit.js';
import { requireAuth } from '../../middleware/auth.js';
import { forbidden, notFound } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);
const clinicalRoles = [Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];
router.get('/', asyncHandler(async (req, res) => {
  const query = z.object({ patientId: z.string().cuid().optional() }).parse(req.query);
  const ownPatient = await prisma.patient.findUnique({ where: { userId: req.user!.id } });
  const patientId = query.patientId ?? ownPatient?.id;
  if (!patientId) throw notFound('Patient profile not found');
  if (query.patientId) await assertPatientAccess(req.user!.id, req.user!.roles, patientId);
  res.json(await prisma.messageThread.findMany({ where: { patientId }, include: { messages: { orderBy: { createdAt: 'asc' } } }, orderBy: { updatedAt: 'desc' } }));
}));
router.post('/', audit('MESSAGE_CREATED', 'Message'), asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string().cuid().optional(), threadId: z.string().cuid().optional(), channel: z.nativeEnum(MessageChannel).default(MessageChannel.IN_APP), subject: z.string().max(200).optional(), body: z.string().min(1).max(10000) }).refine((value) => value.patientId || value.threadId, 'A patient or message thread is required').parse(req.body);
  let thread = body.threadId ? await prisma.messageThread.findUnique({ where: { id: body.threadId } }) : null;
  if (!thread) {
    if (!body.patientId) throw notFound('Message thread not found');
    thread = await prisma.messageThread.create({ data: { patientId: body.patientId, subject: body.subject } });
  }
  await assertPatientAccess(req.user!.id, req.user!.roles, thread.patientId);
  const message = await prisma.message.create({ data: { threadId: thread.id, senderId: req.user!.id, channel: body.channel, body: body.body, status: 'QUEUED' } });
  res.status(201).json(message);
}));
async function assertPatientAccess(userId: string, roles: Role[], patientId: string) {
  if (roles.includes(Role.ADMIN)) return;
  const ownPatient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (ownPatient?.id === patientId) return;
  if (roles.some((role) => clinicalRoles.includes(role)) && await prisma.patientAssignment.findFirst({ where: { patientId, userId, active: true } })) return;
  throw forbidden();
}
export default router;
