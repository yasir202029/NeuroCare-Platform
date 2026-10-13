import { Router } from 'express';
import { CoverStatus, PatientAssignmentRole, Prisma, Role, TeamType, TeamQueueStatus, TeamQueueType, WorkflowStage } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../shared/db.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);
const clinicalRoles = [Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];

async function audit(actorId: string, action: string, resource: string, resourceId: string, metadata?: unknown) {
  await prisma.auditEvent.create({ data: { actorId, action, resource, resourceId, metadata: metadata as Prisma.InputJsonValue | undefined } });
}

router.get('/', requireRole(Role.ADMIN, ...clinicalRoles.slice(1)), asyncHandler(async (_req, res) => { res.json(await prisma.team.findMany({ where: { active: true }, include: { members: { where: { active: true }, include: { user: { select: { id: true, firstName: true, lastName: true, roles: true } } } } }, orderBy: { name: 'asc' } })); }));
router.get('/:teamCode/queue', asyncHandler(async (req, res, next) => {
  const team = await prisma.team.findUnique({ where: { code: String(req.params.teamCode) } });
  if (!team) throw notFound('Team not found');
  const isAdmin = req.user!.roles.includes(Role.ADMIN);
  const member = await prisma.teamMember.findFirst({ where: { teamId: team.id, userId: req.user!.id, active: true } });
  if (!isAdmin && !member) return next(forbidden('You are not a member of this team'));
  const query = z.object({ status: z.nativeEnum(TeamQueueStatus).optional(), type: z.nativeEnum(TeamQueueType).optional() }).parse(req.query);
  res.json(await prisma.teamQueueItem.findMany({ where: { teamId: team.id, status: query.status, type: query.type }, include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } }, assignedTo: { select: { firstName: true, lastName: true } } }, orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'asc' }] }));
}));
router.post('/patients/:patientId/assignments', requireRole(...clinicalRoles), asyncHandler(async (req, res) => {
  const body = z.object({ userId: z.string().cuid(), teamId: z.string().cuid(), role: z.nativeEnum(PatientAssignmentRole), reason: z.string().max(500).optional(), isPrimary: z.boolean().default(true) }).parse(req.body);
  const [patient, member] = await Promise.all([prisma.patient.findUnique({ where: { id: String(req.params.patientId) } }), prisma.teamMember.findFirst({ where: { teamId: body.teamId, userId: body.userId, active: true } })]);
  if (!patient) throw notFound('Patient not found');
  if (!member) throw badRequest('The assigned user must be an active member of the selected team');
  const assignment = await prisma.patientAssignment.create({ data: { patientId: patient.id, userId: body.userId, teamId: body.teamId, role: body.role, reason: body.reason, isPrimary: body.isPrimary, assignedById: req.user!.id } });
  await audit(req.user!.id, 'PATIENT_ROLE_ASSIGNED', 'PatientAssignment', assignment.id, { patientId: patient.id, role: body.role, teamId: body.teamId });
  res.status(201).json(assignment);
}));
router.get('/patients/:patientId/assignments', requireRole(...clinicalRoles), asyncHandler(async (req, res) => { res.json(await prisma.patientAssignment.findMany({ where: { patientId: String(req.params.patientId), active: true }, include: { team: true, user: { select: { id: true, firstName: true, lastName: true, roles: true } }, cover: { where: { status: { in: [CoverStatus.PLANNED, CoverStatus.ACTIVE] } } } } })); }));
router.post('/patients/:patientId/workflow', requireRole(...clinicalRoles), asyncHandler(async (req, res) => {
  const body = z.object({ teamId: z.string().cuid().optional(), toStage: z.nativeEnum(WorkflowStage), reason: z.string().max(1000).optional(), metadata: z.record(z.string(), z.unknown()).optional(), queueType: z.nativeEnum(TeamQueueType).optional(), queueTitle: z.string().max(200).optional() }).parse(req.body);
  const patientId = String(req.params.patientId);
  const previous = await prisma.workflowTransition.findFirst({ where: { patientId }, orderBy: { createdAt: 'desc' } });
  const transition = await prisma.workflowTransition.create({ data: { patientId, teamId: body.teamId, actorId: req.user!.id, fromStage: previous?.toStage, toStage: body.toStage, reason: body.reason, metadata: body.metadata as Prisma.InputJsonValue | undefined } });
  if (body.teamId && body.queueType && body.queueTitle) await prisma.teamQueueItem.create({ data: { patientId, teamId: body.teamId, type: body.queueType, title: body.queueTitle, metadata: { workflowTransitionId: transition.id } } });
  await audit(req.user!.id, 'PATIENT_WORKFLOW_TRANSITIONED', 'Patient', patientId, { fromStage: previous?.toStage, toStage: body.toStage });
  res.status(201).json(transition);
}));
router.get('/patients/:patientId/handoffs', requireRole(...clinicalRoles), asyncHandler(async (req, res) => {
  const patientId = String(req.params.patientId);
  const isAdmin = req.user!.roles.includes(Role.ADMIN);
  const handoffs = await prisma.coverArrangement.findMany({
    where: {
      patientId,
      ...(isAdmin ? {} : { OR: [{ originalUserId: req.user!.id }, { coveringUserId: req.user!.id }] }),
    },
    include: {
      originalUser: { select: { id: true, firstName: true, lastName: true } },
      coveringUser: { select: { id: true, firstName: true, lastName: true } },
      patientAssignment: { select: { teamId: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(handoffs);
}));

router.post(['/patients/:patientId/handoffs', '/patients/:patientId/cover'], requireRole(Role.ADMIN), asyncHandler(async (req, res) => {
  const body = z.object({ patientAssignmentId: z.string().cuid(), coveringUserId: z.string().cuid(), startsAt: z.coerce.date(), endsAt: z.coerce.date().optional(), reason: z.string().trim().min(1).max(500) }).parse(req.body);
  if (body.endsAt && body.endsAt <= body.startsAt) throw badRequest('Handoff end time must be after its start time');
  const assignment = await prisma.patientAssignment.findUnique({ where: { id: body.patientAssignmentId } });
  if (!assignment || assignment.patientId !== String(req.params.patientId) || !assignment.active) throw notFound('Active patient assignment not found');
  if (assignment.userId === body.coveringUserId) throw badRequest('The covering clinician must differ from the assigned clinician');
  const [coveringMember, activeHandoff] = await Promise.all([
    prisma.teamMember.findFirst({ where: { teamId: assignment.teamId, userId: body.coveringUserId, active: true }, include: { user: { select: { status: true, roles: true } } } }),
    prisma.coverArrangement.findFirst({ where: { patientAssignmentId: assignment.id, status: { in: [CoverStatus.PLANNED, CoverStatus.ACTIVE] } } }),
  ]);
  if (!coveringMember || coveringMember.user.status !== 'ACTIVE' || !coveringMember.user.roles.some((role) => clinicalRoles.includes(role))) throw badRequest('The covering user must be an active clinical member of the assigned team');
  if (activeHandoff) throw badRequest('This assignment already has an active handoff');
  const handoff = await prisma.$transaction(async (tx) => {
    const created = await tx.coverArrangement.create({ data: { patientId: assignment.patientId, patientAssignmentId: assignment.id, originalUserId: assignment.userId, coveringUserId: body.coveringUserId, startsAt: body.startsAt, endsAt: body.endsAt, reason: body.reason, status: CoverStatus.ACTIVE, notificationSentAt: new Date() } });
    await tx.notification.create({ data: { userId: body.coveringUserId, type: 'TASK_ASSIGNED', title: 'Patient handoff assigned', body: `You are covering patient ${assignment.patientId} until ${body.endsAt?.toISOString() ?? 'further notice'}.` } });
    await tx.auditEvent.create({ data: { actorId: req.user!.id, action: 'PATIENT_HANDOFF_CREATED', resource: 'CoverArrangement', resourceId: created.id, metadata: { patientId: assignment.patientId, patientAssignmentId: assignment.id, originalUserId: assignment.userId, coveringUserId: body.coveringUserId, startsAt: body.startsAt.toISOString(), endsAt: body.endsAt?.toISOString() ?? null } } });
    return created;
  });
  res.status(201).json(handoff);
}));

router.post(['/handoffs/:id/return', '/cover/:id/return'], requireRole(...clinicalRoles), asyncHandler(async (req, res, next) => {
  const handoff = await prisma.coverArrangement.findUnique({ where: { id: String(req.params.id) } });
  if (!handoff || handoff.status === CoverStatus.RETURNED) throw notFound('Active handoff not found');
  const isAdmin = req.user!.roles.includes(Role.ADMIN);
  if (!isAdmin && handoff.originalUserId !== req.user!.id && handoff.coveringUserId !== req.user!.id) return next(forbidden('You are not assigned to this handoff'));
  const updated = await prisma.$transaction(async (tx) => {
    const returned = await tx.coverArrangement.update({ where: { id: handoff.id }, data: { status: CoverStatus.RETURNED, returnedAt: new Date() } });
    await tx.notification.create({ data: { userId: handoff.originalUserId, type: 'TASK_ASSIGNED', title: 'Patient handoff returned', body: 'This patient has returned to your workload.' } });
    await tx.auditEvent.create({ data: { actorId: req.user!.id, action: 'PATIENT_HANDOFF_RETURNED', resource: 'CoverArrangement', resourceId: handoff.id, metadata: { patientId: handoff.patientId, originalUserId: handoff.originalUserId, coveringUserId: handoff.coveringUserId } } });
    return returned;
  });
  res.json(updated);
}));
export default router;
