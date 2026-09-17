import { Router } from 'express';
import { AppointmentStatus, Role, SessionEventType, VideoProvider } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { audit } from '../../middleware/audit.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../../shared/errors.js';
import { AiSessionService } from '../../services/ai-session.service.js';
import { VideoProviderService } from '../../services/video-provider.service.js';

const router = Router();
const provider = new VideoProviderService();
const ai = new AiSessionService();
router.use(requireAuth);

router.post('/sessions', requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), audit('VIDEO_SESSION_CREATED', 'VideoSession'), asyncHandler(async (req, res) => {
  const body = z.object({ appointmentId: z.string().cuid(), provider: z.nativeEnum(VideoProvider).optional() }).parse(req.body);
  const appointment = await prisma.appointment.findUnique({ where: { id: body.appointmentId }, include: { patient: { include: { user: true } } } });
  if (!appointment) throw notFound('Appointment not found');
  if (appointment.mode !== 'VIDEO') throw badRequest('Video sessions require a video appointment');
  const meeting = await provider.createMeeting(body.provider ?? VideoProvider.ZOOM, { subject: `${appointment.type} assessment`, startsAt: appointment.startsAt, durationMinutes: Math.max(30, Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000)) });
  const session = await prisma.videoSession.create({ data: { appointmentId: appointment.id, provider: meeting.provider, providerSessionId: meeting.providerSessionId, joinUrl: meeting.joinUrl, clinicianJoinUrl: meeting.clinicianJoinUrl, events: { create: { type: SessionEventType.SESSION_CREATED, participantId: req.user!.id, participantRole: 'clinician' } } } });
  res.status(201).json({ ...session, meeting });
}));

router.get('/sessions/:id', asyncHandler(async (req, res) => {
  const session = await prisma.videoSession.findUnique({ where: { id: String(req.params.id) }, include: { appointment: { include: { attendance: true, patient: { include: { user: { select: { firstName: true, lastName: true } } } }, clinician: { include: { user: { select: { firstName: true, lastName: true } } } } } }, recording: true, events: { orderBy: { occurredAt: 'asc' } }, aiSession: { include: { transcript: { include: { segments: true } }, summary: true, extraction: true } } } });
  if (!session) throw notFound('Video session not found');
  res.json(session);
}));

router.post('/sessions/:id/waiting-room/open', requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const session = await prisma.videoSession.update({ where: { id }, data: { waitingRoomOpenedAt: new Date(), events: { create: { type: SessionEventType.WAITING_ROOM_OPENED, participantId: req.user!.id, participantRole: 'clinician' } } } });
  res.json(session);
}));

router.post('/sessions/:id/join', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const body = z.object({ participantRole: z.enum(['patient', 'clinician']) }).parse(req.body);
  const session = await prisma.videoSession.findUnique({ where: { id }, include: { appointment: { include: { patient: true, clinician: true } } } });
  if (!session) throw notFound('Video session not found');
  const isClinician = body.participantRole === 'clinician';
  const isAdmin = req.user!.roles.includes(Role.ADMIN);
  const ownsAppointment = isClinician ? session.appointment.clinician?.userId === req.user!.id : session.appointment.patient.userId === req.user!.id;
  if (!isAdmin && !ownsAppointment) throw forbidden('You are not a participant in this appointment');
  await prisma.attendanceRecord.upsert({ where: { appointmentId: session.appointmentId }, create: { appointmentId: session.appointmentId, ...(isClinician ? { clinicianJoinedAt: new Date(), clinicianPresent: true } : { patientJoinedAt: new Date(), patientPresent: true }) }, update: isClinician ? { clinicianJoinedAt: new Date(), clinicianPresent: true } : { patientJoinedAt: new Date(), patientPresent: true } });
  await prisma.videoSessionEvent.create({ data: { videoSessionId: id, type: SessionEventType.PARTICIPANT_JOINED, participantId: req.user!.id, participantRole: body.participantRole } });
  res.json({ joinUrl: isClinician ? session.clinicianJoinUrl : session.joinUrl, waitingRoom: !isClinician && !session.waitingRoomOpenedAt });
}));

router.post('/sessions/:id/start', requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), audit('VIDEO_SESSION_STARTED', 'VideoSession'), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const session = await prisma.videoSession.update({ where: { id }, data: { startedAt: new Date(), events: { create: { type: SessionEventType.SESSION_STARTED, participantId: req.user!.id, participantRole: 'clinician' } }, appointment: { update: { status: AppointmentStatus.IN_PROGRESS } } }, include: { appointment: true } });
  const aiSession = await ai.start(id);
  res.json({ session, aiSession, transcription: { active: true, provider: aiSession.provider, language: aiSession.language } });
}));

router.post('/sessions/:id/recording-consent', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const body = z.object({ consented: z.boolean(), consentText: z.string().min(10) }).parse(req.body);
  const session = await prisma.videoSession.findUnique({ where: { id }, include: { appointment: true } });
  if (!session) throw notFound('Video session not found');
  const patient = await prisma.patient.findUnique({ where: { id: session.appointment.patientId } });
  if (!patient) throw notFound('Patient not found');
  res.json(await prisma.recordingConsent.upsert({ where: { patientId_videoSessionId: { patientId: patient.id, videoSessionId: id } }, create: { patientId: patient.id, videoSessionId: id, consented: body.consented, consentText: body.consentText }, update: body }));
}));

router.post('/sessions/:id/recording/start', requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const consent = await prisma.recordingConsent.findFirst({ where: { videoSessionId: id, consented: true } });
  if (!consent) throw badRequest('Recording consent is required before recording');
  const session = await provider.startRecording(id);
  const recording = await prisma.recording.upsert({ where: { videoSessionId: id }, create: { videoSessionId: id, providerRecordingId: session.providerRecordingId, status: 'RECORDING', startedAt: new Date() }, update: { providerRecordingId: session.providerRecordingId, status: 'RECORDING', startedAt: new Date() } });
  await prisma.videoSession.update({ where: { id }, data: { recordingEnabled: true, events: { create: { type: SessionEventType.RECORDING_STARTED, participantId: req.user!.id, participantRole: 'clinician' } } } });
  res.json(recording);
}));

router.post('/sessions/:id/recording/stop', requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const recording = await prisma.recording.findUnique({ where: { videoSessionId: id } });
  if (!recording?.providerRecordingId) throw notFound('Recording not found');
  const stopped = await provider.stopRecording(recording.providerRecordingId);
  const updated = await prisma.recording.update({ where: { id: recording.id }, data: { status: 'READY', endedAt: new Date(), storagePath: stopped.recordingUrl } });
  await prisma.videoSession.update({ where: { id }, data: { recordingUrl: stopped.recordingUrl, events: { create: { type: SessionEventType.RECORDING_STOPPED, participantId: req.user!.id, participantRole: 'clinician' } } } });
  res.json(updated);
}));

router.post('/sessions/:id/end', requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE), audit('VIDEO_SESSION_ENDED', 'VideoSession'), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const session = await prisma.videoSession.update({ where: { id }, data: { endedAt: new Date(), events: { create: { type: SessionEventType.SESSION_ENDED, participantId: req.user!.id, participantRole: 'clinician' } }, appointment: { update: { status: AppointmentStatus.COMPLETED } } }, include: { appointment: true } });
  const aiResult = await ai.end(id);
  res.json({ session, ai: aiResult });
}));

export default router;
