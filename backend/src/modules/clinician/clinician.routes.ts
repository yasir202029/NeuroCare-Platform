import { Router } from 'express';
import { AppointmentStatus, Prisma, Role, TaskStatus, TaskType } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';
import { prisma } from '../../shared/db.js';

const router = Router();
const clinicianRoles = [Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];
router.use(requireAuth, requireRole(...clinicianRoles));
const person = { select: { id: true, firstName: true, lastName: true } } as const;
const patient = { include: { user: person } } as const;
const dayRange = (now = new Date()) => {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
};
async function currentClinician(userId: string) {
  const clinician = await prisma.clinician.findUnique({ where: { userId } });
  if (!clinician) throw notFound('Clinician profile not found');
  return clinician;
}
function toWorkItem(kind: string, item: { id: string; patient?: { user: { firstName: string; lastName: string } } | null; title?: string; startsAt?: Date; dueAt?: Date; updatedAt?: Date }) {
  return { id: item.id, kind, patientId: item.patient ? (item.patient as { id: string }).id : null, patientName: item.patient ? `${item.patient.user.firstName} ${item.patient.user.lastName}` : 'Unassigned patient', title: item.title ?? kind, dueAt: item.startsAt ?? item.dueAt ?? item.updatedAt ?? null };
}

router.get('/today', asyncHandler(async (req, res) => {
  const clinician = await currentClinician(req.user!.id);
  const { start, end } = dayRange();
  const [appointments, waiting, titrations, reports, prescriptions, messages, urgent, followUps] = await Promise.all([
    prisma.appointment.findMany({ where: { clinicianId: clinician.id, startsAt: { gte: start, lt: end }, status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.DID_NOT_ATTEND] } }, include: { patient }, orderBy: { startsAt: 'asc' } }),
    prisma.appointment.findMany({ where: { clinicianId: clinician.id, startsAt: { lte: new Date() }, status: { in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED] } }, include: { patient }, orderBy: { startsAt: 'asc' }, take: 25 }),
    prisma.teamQueueItem.findMany({ where: { assignedToId: req.user!.id, status: { in: ['OPEN', 'IN_PROGRESS'] }, type: 'ACTIVE_TITRATION' }, include: { patient }, orderBy: { updatedAt: 'desc' } }),
    prisma.report.findMany({ where: { clinicianId: clinician.id, status: { in: ['DRAFT', 'REVIEW_REQUIRED'] } }, include: { patient }, orderBy: { updatedAt: 'desc' }, take: 25 }),
    prisma.prescription.findMany({ where: { clinicianId: clinician.id, status: { in: ['DRAFT', 'PENDING_SIGNATURE'] } }, include: { patient }, orderBy: { updatedAt: 'desc' }, take: 25 }),
    prisma.messageThread.findMany({ where: { patient: { assignments: { some: { userId: req.user!.id, active: true } } } }, include: { patient, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' }, take: 25 }),
    prisma.physicalHealthReview.findMany({ where: { clinicianId: clinician.id, alerts: { some: { acknowledgedAt: null } } }, include: { patient, alerts: { where: { acknowledgedAt: null } } }, orderBy: { reviewDate: 'desc' }, take: 25 }),
    prisma.clinicalTask.findMany({ where: { clinicianId: clinician.id, status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] }, dueAt: { gte: start } }, orderBy: { dueAt: 'asc' }, take: 25 }),
  ]);
  res.json({
    todayAppointments: appointments.map((item) => toWorkItem('Appointment', item)),
    waitingPatients: waiting.map((item) => toWorkItem('Waiting patient', item)),
    activeTitrations: titrations.map((item) => toWorkItem('Active titration', item)),
    pendingReports: reports.map((item) => toWorkItem('Pending report', { ...item, title: item.title })),
    pendingPrescriptions: prescriptions.map((item) => toWorkItem('Pending prescription', { ...item, title: item.status.replaceAll('_', ' ') })),
    messages: messages.map((item) => toWorkItem('Message', { ...item, title: item.subject ?? item.messages[0]?.body ?? 'Patient message' })),
    urgentReviews: urgent.map((item) => toWorkItem('Urgent review', { ...item, title: `${item.alerts.length} unacknowledged clinical alert${item.alerts.length === 1 ? '' : 's'}` })),
    upcomingFollowUps: followUps.filter((item) => item.patientId).map((item) => ({ id: item.id, kind: 'Upcoming follow-up', patientId: item.patientId, patientName: 'Open patient workspace', title: item.title, dueAt: item.dueAt })),
  });
}));

router.get('/patients/:patientId/workspace', asyncHandler(async (req, res, next) => {
  const clinician = await currentClinician(req.user!.id);
  const patientId = String(req.params.patientId);
  const allowed = await prisma.patient.findFirst({ where: { id: patientId, OR: [{ assessments: { some: { clinicianId: clinician.id } } }, { assignments: { some: { userId: req.user!.id, active: true } } }] }, select: { id: true } });
  if (!allowed) return next(forbidden('You are not assigned to this patient'));
  const record = await prisma.patient.findUnique({ where: { id: patientId }, include: { user: person, appointments: { where: { clinicianId: clinician.id }, orderBy: { startsAt: 'desc' } }, assessments: { where: { clinicianId: clinician.id }, orderBy: { updatedAt: 'desc' } }, notes: { where: { clinicianId: clinician.id }, orderBy: { createdAt: 'desc' } }, documents: { orderBy: { createdAt: 'desc' } }, messageThreads: { include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } }, physicalReviews: { where: { clinicianId: clinician.id }, orderBy: { reviewDate: 'desc' }, include: { alerts: true } }, reports: { where: { clinicianId: clinician.id }, orderBy: { updatedAt: 'desc' } }, prescriptions: { where: { clinicianId: clinician.id }, orderBy: { updatedAt: 'desc' } }, invoices: { orderBy: { updatedAt: 'desc' } }, workflowTransitions: { orderBy: { createdAt: 'desc' }, take: 50 }, queueItems: { where: { assignedToId: req.user!.id, status: { in: ['OPEN', 'IN_PROGRESS'] } }, orderBy: { updatedAt: 'desc' } } } });
  if (!record) throw notFound('Patient not found');
  res.json(record);
}));

router.patch('/patients/:patientId', asyncHandler(async (req, res, next) => {
  const body = z.object({ medicalHistory: z.string().max(10000).nullable().optional(), currentMedication: z.unknown().optional(), accessibilityNeeds: z.string().max(2000).nullable().optional(), preferredContact: z.string().max(30).nullable().optional() }).parse(req.body);
  const clinician = await currentClinician(req.user!.id);
  const patient = await prisma.patient.findFirst({ where: { id: String(req.params.patientId), OR: [{ assessments: { some: { clinicianId: clinician.id } } }, { assignments: { some: { userId: req.user!.id, active: true } } }] } });
  if (!patient) return next(forbidden('You are not assigned to this patient'));
  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.patient.update({ where: { id: patient.id }, data: { ...body, currentMedication: body.currentMedication as Prisma.InputJsonValue | undefined } });
    await tx.auditEvent.create({ data: { actorId: req.user!.id, action: 'CLINICIAN_PATIENT_WORKSPACE_UPDATED', resource: 'Patient', resourceId: patient.id, metadata: { fields: Object.keys(body) } } });
    return record;
  });
  res.json(updated);
}));

router.post('/patients/:patientId/follow-ups', asyncHandler(async (req, res, next) => {
  const body = z.object({ interval: z.enum(['2w', '4w', '6w', '3m', '6m', 'custom']), dueAt: z.coerce.date().optional(), note: z.string().trim().max(1000).optional() }).parse(req.body);
  const clinician = await currentClinician(req.user!.id);
  const patient = await prisma.patient.findFirst({ where: { id: String(req.params.patientId), OR: [{ assessments: { some: { clinicianId: clinician.id } } }, { assignments: { some: { userId: req.user!.id, active: true } } }] } });
  if (!patient) return next(forbidden('You are not assigned to this patient'));
  const days = { '2w': 14, '4w': 28, '6w': 42, '3m': 90, '6m': 180, custom: 0 }[body.interval];
  const dueAt = body.dueAt ?? (days ? new Date(Date.now() + days * 86400000) : undefined);
  if (!dueAt) throw badRequest('A custom follow-up requires a due date');
  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.clinicalTask.create({ data: { type: TaskType.ADMIN, status: TaskStatus.OPEN, title: 'Book clinician follow-up', dueAt, patientId: patient.id, clinicianId: clinician.id, assignedToId: req.user!.id, metadata: { workflow: 'FOLLOW_UP', interval: body.interval, note: body.note ?? null } } });
    await tx.notification.create({ data: { userId: patient.userId, type: 'APPOINTMENT_REMINDER', title: 'Follow-up requested', body: `Your clinician has requested a follow-up by ${dueAt.toLocaleDateString('en-GB')}.` } });
    await tx.auditEvent.create({ data: { actorId: req.user!.id, action: 'FOLLOW_UP_SCHEDULED', resource: 'Patient', resourceId: patient.id, metadata: { taskId: created.id, dueAt: dueAt.toISOString(), interval: body.interval } as Prisma.InputJsonValue } });
    return created;
  });
  res.status(201).json(task);
}));

export default router;
