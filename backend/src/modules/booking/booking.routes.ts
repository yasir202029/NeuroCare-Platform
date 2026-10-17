import { Router } from "express";
import { z } from "zod";
import {
  AppointmentMode,
  AppointmentStatus,
  AssessmentType,
  Role,
  SessionEventType,
} from "@prisma/client";
import { prisma } from "../../shared/db.js";
import { asyncHandler } from "../../shared/http.js";
import { audit } from "../../middleware/audit.js";
import {
  clinicalStaffRoles,
  requireAuth,
  requireRole,
} from "../../middleware/auth.js";
import { badRequest, notFound } from "../../shared/errors.js";

const router = Router();
router.use(requireAuth);
const booking = z.object({
  type: z.nativeEnum(AssessmentType),
  mode: z.nativeEnum(AppointmentMode),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  clinicianId: z.string().cuid().optional(),
  availabilityId: z.string().cuid().optional(),
});
const appointmentTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.DID_NOT_ATTEND,
  ],
  IN_PROGRESS: [AppointmentStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  DID_NOT_ATTEND: [],
};

router.get(
  "/availability",
  requireRole(Role.PATIENT, ...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        from: z.coerce.date(),
        to: z.coerce.date(),
        clinicianId: z.string().cuid().optional(),
      })
      .parse(req.query);
    res.json(
      await prisma.availability.findMany({
        where: {
          booked: false,
          startsAt: { gte: query.from, lte: query.to },
          clinicianId: query.clinicianId,
        },
        orderBy: { startsAt: "asc" },
      }),
    );
  }),
);
router.post(
  "/appointments",
  requireRole(Role.PATIENT),
  audit("APPOINTMENT_REQUESTED", "Appointment"),
  asyncHandler(async (req, res) => {
    const body = booking.parse(req.body);
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patient)
      throw badRequest("A patient profile is required to book an assessment");
    const appointment = await prisma.$transaction(async (tx) => {
      let slot = null;
      if (body.availabilityId) {
        slot = await tx.availability.findUnique({
          where: { id: body.availabilityId },
        });
        if (!slot) throw notFound("Appointment slot not found");
        const reserved = await tx.availability.updateMany({
          where: { id: slot.id, booked: false },
          data: { booked: true },
        });
        if (!reserved.count)
          throw badRequest("This appointment slot is no longer available");
      }
      return tx.appointment.create({
        data: {
          patientId: patient.id,
          type: body.type,
          mode: slot?.mode ?? body.mode,
          startsAt: slot?.startsAt ?? body.startsAt,
          endsAt: slot?.endsAt ?? body.endsAt,
          clinicianId: slot?.clinicianId ?? body.clinicianId,
          availabilityId: slot?.id,
          status: AppointmentStatus.REQUESTED,
          statusEvents: { create: { status: AppointmentStatus.REQUESTED } },
        },
      });
    });
    res.status(201).json(appointment);
  }),
);
router.get(
  "/appointments",
  requireRole(Role.PATIENT, ...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    let where = {};
    if (req.user!.roles.includes(Role.PATIENT)) {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!patient) throw notFound("Patient profile not found");
      where = { patientId: patient.id };
    } else if (!req.user!.roles.includes(Role.ADMIN)) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!clinician) throw notFound("Clinician profile not found");
      where = { clinicianId: clinician.id };
    }
    res.json(
      await prisma.appointment.findMany({
        where,
        include: {
          attendance: true,
          videoSession: {
            select: {
              id: true,
              provider: true,
              waitingRoomOpenedAt: true,
              startedAt: true,
              endedAt: true,
            },
          },
          patient: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          clinician: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { startsAt: "asc" },
      }),
    );
  }),
);
router.patch(
  "/appointments/:id/status",
  requireRole(...clinicalStaffRoles),
  audit("APPOINTMENT_STATUS_UPDATED", "Appointment"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.nativeEnum(AppointmentStatus),
        cancellationReason: z.string().max(500).optional(),
      })
      .parse(req.body);
    const current = await prisma.appointment.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!current) throw notFound("Appointment not found");
    if (!req.user!.roles.includes(Role.ADMIN)) {
      const clinician = await prisma.clinician.findUnique({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!clinician || current.clinicianId !== clinician.id)
        throw notFound("Assigned appointment not found");
    }
    if (!appointmentTransitions[current.status].includes(body.status))
      throw badRequest(
        `Cannot change appointment from ${current.status} to ${body.status}`,
      );
    const now = new Date();
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: current.id },
        data: {
          status: body.status,
          cancellationReason: body.cancellationReason,
        },
      });
      await tx.appointmentStatusEvent.create({
        data: {
          appointmentId: current.id,
          status: body.status,
          reason: body.cancellationReason,
        },
      });
      if (body.status === AppointmentStatus.IN_PROGRESS) {
        await tx.attendanceRecord.upsert({
          where: { appointmentId: current.id },
          create: {
            appointmentId: current.id,
            clinicianPresent: true,
            clinicianJoinedAt: now,
          },
          update: { clinicianPresent: true, clinicianJoinedAt: now },
        });
      } else if (body.status === AppointmentStatus.COMPLETED) {
        await tx.attendanceRecord.upsert({
          where: { appointmentId: current.id },
          create: {
            appointmentId: current.id,
            clinicianPresent: true,
            clinicianJoinedAt: now,
            clinicianLeftAt: now,
          },
          update: { clinicianPresent: true, clinicianLeftAt: now },
        });
      } else if (body.status === AppointmentStatus.DID_NOT_ATTEND) {
        await tx.attendanceRecord.upsert({
          where: { appointmentId: current.id },
          create: {
            appointmentId: current.id,
            missedReason: body.cancellationReason ?? "Patient did not attend",
          },
          update: {
            missedReason: body.cancellationReason ?? "Patient did not attend",
          },
        });
      }
      if (body.status === AppointmentStatus.COMPLETED) {
        const videoSession = await tx.videoSession.findUnique({
          where: { appointmentId: current.id },
          select: { id: true },
        });
        if (videoSession) {
          await tx.videoSession.update({
            where: { id: videoSession.id },
            data: {
              endedAt: now,
              events: {
                create: {
                  type: SessionEventType.SESSION_ENDED,
                  participantId: req.user!.id,
                  participantRole: "clinician",
                },
              },
            },
          });
        }
      }
      return updated;
    });
    res.json(appointment);
  }),
);
router.post(
  "/availability",
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        startsAt: z.coerce.date(),
        endsAt: z.coerce.date(),
        mode: z.nativeEnum(AppointmentMode),
      })
      .parse(req.body);
    if (body.endsAt <= body.startsAt)
      throw badRequest("End time must be after start time");
    const clinician = await prisma.clinician.findUnique({
      where: { userId: req.user!.id },
    });
    if (!clinician) throw notFound("Clinician profile not found");
    res.status(201).json(
      await prisma.availability.create({
        data: { ...body, clinicianId: clinician.id },
      }),
    );
  }),
);

router.patch(
  "/patients/me/appointments/:id/status",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.nativeEnum(AppointmentStatus),
        cancellationReason: z.string().max(500).optional(),
      })
      .parse(req.body);
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patient) throw notFound("Patient profile not found");
    const current = await prisma.appointment.findUnique({
      where: { id: String(req.params.id), patientId: patient.id },
    });
    if (!current) throw notFound("Appointment not found");
    if (!["CANCELLED", "DID_NOT_ATTEND"].includes(body.status))
      throw badRequest(
        "Patients may only cancel or mark as did-not-attend their own appointments",
      );
    if (body.status === "DID_NOT_ATTEND" && !body.cancellationReason)
      throw badRequest("Please provide a reason for missing this appointment");
    const updated = await prisma.appointment.update({
      where: { id: current.id },
      data: {
        status: body.status,
        cancellationReason: body.cancellationReason,
        lastUpdatedAt: new Date(),
      },
      include: {
        clinician: {
          select: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    await prisma.appointmentStatusEvent.create({
      data: {
        appointmentId: current.id,
        status: body.status,
        reason: body.cancellationReason,
      },
    });
    res.json(updated);
  }),
);

export default router;