import { Router } from "express";
import {
  AppointmentStatus,
  Role,
  SessionEventType,
  VideoProvider,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../shared/db.js";
import { asyncHandler } from "../../shared/http.js";
import { audit } from "../../middleware/audit.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { badRequest, forbidden, notFound } from "../../shared/errors.js";
import { AiSessionService } from "../../services/ai-session.service.js";
import { VideoProviderService } from "../../services/video-provider.service.js";

const router = Router();
const provider = new VideoProviderService();
const ai = new AiSessionService();
const joinableAppointmentStatuses: AppointmentStatus[] = [
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
];
router.use(requireAuth);

async function requireAssignedClinician(
  sessionId: string,
  userId: string,
  roles: Role[],
) {
  const session = await prisma.videoSession.findUnique({
    where: { id: sessionId },
    include: { appointment: { include: { clinician: true } } },
  });
  if (!session) throw notFound("Video session not found");
  if (
    !roles.includes(Role.ADMIN) &&
    session.appointment.clinician?.userId !== userId
  ) {
    throw forbidden("You are not assigned to this video session");
  }
  return session;
}

router.post(
  "/sessions",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
  audit("VIDEO_SESSION_CREATED", "VideoSession"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        appointmentId: z.string().cuid(),
        provider: z.nativeEnum(VideoProvider).optional(),
      })
      .parse(req.body);
    const appointment = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
      include: { patient: { include: { user: true } }, clinician: true },
    });
    if (!appointment) throw notFound("Appointment not found");
    if (appointment.mode !== "VIDEO")
      throw badRequest("Video sessions require a video appointment");
    if (appointment.status !== AppointmentStatus.CONFIRMED)
      throw badRequest("Confirm the appointment before creating a video room");
    if (!appointment.clinician)
      throw badRequest("Assign a clinician before creating a video room");
    if (
      !req.user!.roles.includes(Role.ADMIN) &&
      appointment.clinician?.userId !== req.user!.id
    )
      throw forbidden("You are not assigned to this appointment");
    const meeting = await provider.createMeeting(
      body.provider ?? VideoProvider.ZOOM,
      {
        subject: `${appointment.type} assessment`,
        startsAt: appointment.startsAt,
        durationMinutes: Math.max(
          30,
          Math.round(
            (appointment.endsAt.getTime() - appointment.startsAt.getTime()) /
              60000,
          ),
        ),
      },
    );
    const session = await prisma.videoSession.create({
      data: {
        appointmentId: appointment.id,
        provider: meeting.provider,
        providerSessionId: meeting.providerSessionId,
        joinUrl: meeting.joinUrl,
        clinicianJoinUrl: meeting.clinicianJoinUrl,
        events: {
          create: {
            type: SessionEventType.SESSION_CREATED,
            participantId: req.user!.id,
            participantRole: "clinician",
          },
        },
      },
    });
    res.status(201).json({ ...session, meeting });
  }),
);

router.get(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    const session = await prisma.videoSession.findUnique({
      where: { id: String(req.params.id) },
      include: {
        appointment: {
          include: {
            attendance: true,
            patient: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
            clinician: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        recording: true,
        events: { orderBy: { occurredAt: "asc" } },
        aiSession: {
          include: {
            transcript: { include: { segments: true } },
            summary: true,
            extraction: true,
          },
        },
      },
    });
    if (!session) throw notFound("Video session not found");
    const isAdmin = req.user!.roles.includes(Role.ADMIN);
    const isClinician = session.appointment.clinician?.user.id === req.user!.id;
    const isPatient = session.appointment.patient.user.id === req.user!.id;
    if (!isAdmin && !isClinician && !isPatient)
      throw forbidden("You are not a participant in this appointment");
    if (isPatient && !isAdmin) {
      const {
        clinicianJoinUrl: _privateHostUrl,
        recording,
        aiSession,
        ...patientSession
      } = session;
      return res.json({
        ...patientSession,
        recording: recording ? { status: recording.status } : null,
        aiSession: null,
      });
    }
    return res.json(session);
  }),
);

router.post(
  "/sessions/:id/waiting-room/open",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await requireAssignedClinician(id, req.user!.id, req.user!.roles);
    const session = await prisma.videoSession.update({
      where: { id },
      data: {
        waitingRoomOpenedAt: new Date(),
        events: {
          create: {
            type: SessionEventType.WAITING_ROOM_OPENED,
            participantId: req.user!.id,
            participantRole: "clinician",
          },
        },
      },
    });
    res.json(session);
  }),
);

router.post(
  "/sessions/:id/join",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const body = z
      .object({ participantRole: z.enum(["patient", "clinician"]) })
      .parse(req.body);
    const session = await prisma.videoSession.findUnique({
      where: { id },
      include: { appointment: { include: { patient: true, clinician: true } } },
    });
    if (!session) throw notFound("Video session not found");
    const isClinician = body.participantRole === "clinician";
    const isAdmin = req.user!.roles.includes(Role.ADMIN);
    const ownsAppointment = isClinician
      ? session.appointment.clinician?.userId === req.user!.id
      : session.appointment.patient.userId === req.user!.id;
    if (!isAdmin && !ownsAppointment)
      throw forbidden("You are not a participant in this appointment");
    if (!isClinician && !isAdmin && !session.waitingRoomOpenedAt)
      return res.json({ waitingRoom: true });
    if (!joinableAppointmentStatuses.includes(session.appointment.status))
      throw badRequest("The appointment is not ready to join");
    if (!session.providerSessionId)
      throw badRequest("The video provider session is unavailable");
    const joinedAt = new Date();
    const joinUrl = isClinician
      ? await provider.clinicianJoinUrl(
          session.provider,
          session.providerSessionId,
        )
      : session.joinUrl;
    await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.upsert({
        where: { appointmentId: session.appointmentId },
        create: {
          appointmentId: session.appointmentId,
          ...(isClinician
            ? { clinicianJoinedAt: joinedAt, clinicianPresent: true }
            : { patientJoinedAt: joinedAt, patientPresent: true }),
        },
        update: isClinician
          ? { clinicianJoinedAt: joinedAt, clinicianPresent: true }
          : { patientJoinedAt: joinedAt, patientPresent: true },
      });
      await tx.videoSessionEvent.create({
        data: {
          videoSessionId: id,
          type: SessionEventType.PARTICIPANT_JOINED,
          participantId: req.user!.id,
          participantRole: body.participantRole,
        },
      });
      if (
        isClinician &&
        session.appointment.status === AppointmentStatus.CONFIRMED
      ) {
        await tx.appointment.update({
          where: { id: session.appointmentId },
          data: { status: AppointmentStatus.IN_PROGRESS },
        });
        await tx.appointmentStatusEvent.create({
          data: {
            appointmentId: session.appointmentId,
            status: AppointmentStatus.IN_PROGRESS,
          },
        });
      }
    });
    return res.json({ joinUrl, waitingRoom: false });
  }),
);

router.post(
  "/sessions/:id/start",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
  audit("VIDEO_SESSION_STARTED", "VideoSession"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const assignedSession = await requireAssignedClinician(
      id,
      req.user!.id,
      req.user!.roles,
    );
    if (
      !joinableAppointmentStatuses.includes(assignedSession.appointment.status)
    )
      throw badRequest(
        "The appointment must be confirmed before the session starts",
      );
    const consent = await prisma.recordingConsent.findFirst({
      where: { videoSessionId: id, consented: true },
    });
    if (!consent)
      throw badRequest(
        "Patient consent must be recorded before AI transcription starts",
      );
    const session = await prisma.videoSession.update({
      where: { id },
      data: {
        startedAt: new Date(),
        events: {
          create: {
            type: SessionEventType.SESSION_STARTED,
            participantId: req.user!.id,
            participantRole: "clinician",
          },
        },
        appointment: { update: { status: AppointmentStatus.IN_PROGRESS } },
      },
      include: { appointment: true },
    });
    const aiSession = await ai.start(id);
    res.json({
      session,
      aiSession,
      transcription: {
        active: true,
        provider: aiSession.provider,
        language: aiSession.language,
      },
    });
  }),
);

router.post(
  "/sessions/:id/recording-consent",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const body = z
      .object({ consented: z.boolean(), consentText: z.string().min(10) })
      .parse(req.body);
    const session = await prisma.videoSession.findUnique({
      where: { id },
      include: { appointment: true },
    });
    if (!session) throw notFound("Video session not found");
    const patient = await prisma.patient.findUnique({
      where: { id: session.appointment.patientId },
    });
    if (!patient) throw notFound("Patient not found");
    if (patient.userId !== req.user!.id)
      throw forbidden(
        "Only the patient on this appointment can record consent",
      );
    res.json(
      await prisma.recordingConsent.upsert({
        where: {
          patientId_videoSessionId: {
            patientId: patient.id,
            videoSessionId: id,
          },
        },
        create: {
          patientId: patient.id,
          videoSessionId: id,
          consented: body.consented,
          consentText: body.consentText,
        },
        update: body,
      }),
    );
  }),
);

router.post(
  "/sessions/:id/recording/start",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await requireAssignedClinician(id, req.user!.id, req.user!.roles);
    const consent = await prisma.recordingConsent.findFirst({
      where: { videoSessionId: id, consented: true },
    });
    if (!consent)
      throw badRequest("Recording consent is required before recording");
    throw badRequest("Zoom cloud recording is not configured for this clinic");
  }),
);

router.post(
  "/sessions/:id/recording/stop",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await requireAssignedClinician(id, req.user!.id, req.user!.roles);
    throw badRequest("Zoom cloud recording is not configured for this clinic");
  }),
);

router.post(
  "/sessions/:id/end",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE),
  audit("VIDEO_SESSION_ENDED", "VideoSession"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const assignedSession = await requireAssignedClinician(
      id,
      req.user!.id,
      req.user!.roles,
    );
    if (assignedSession.appointment.status !== AppointmentStatus.IN_PROGRESS)
      throw badRequest("Only an active appointment can be ended");
    const session = await prisma.videoSession.update({
      where: { id },
      data: {
        endedAt: new Date(),
        events: {
          create: {
            type: SessionEventType.SESSION_ENDED,
            participantId: req.user!.id,
            participantRole: "clinician",
          },
        },
        appointment: { update: { status: AppointmentStatus.COMPLETED } },
      },
      include: { appointment: true },
    });
    const aiResult = await ai.end(id);
    res.json({ session, ai: aiResult });
  }),
);

export default router;
