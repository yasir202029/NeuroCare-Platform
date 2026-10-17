import { Router } from "express";
import {
  PrescriptionStatus,
  Role,
  TaskType,
  TitrationStatus,
} from "@prisma/client";
import { z } from "zod";
import { audit } from "../../middleware/audit.js";
import {
  clinicalStaffRoles,
  requireAuth,
  requireRole,
} from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/http.js";
import { prisma } from "../../shared/db.js";
import { badRequest, notFound } from "../../shared/errors.js";

const router = Router();
router.use(requireAuth, requireRole(...clinicalStaffRoles));
const patientInclude = {
  user: {
    select: { firstName: true, lastName: true, email: true, phone: true },
  },
  appointments: { orderBy: { startsAt: "asc" }, take: 20 },
  assessments: {
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      adhd: {
        include: {
          titrationPlans: {
            include: { reviews: { orderBy: { reviewDate: "desc" } } },
          },
        },
      },
      autism: true,
    },
  },
  notes: { orderBy: { createdAt: "desc" }, take: 50 },
  messageThreads: {
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  },
  reports: { orderBy: { updatedAt: "desc" }, take: 20 },
  prescriptions: {
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { items: true },
  },
  documents: { orderBy: { updatedAt: "desc" }, take: 20 },
  feedback: { orderBy: { createdAt: "desc" }, take: 20 },
  complaints: { orderBy: { updatedAt: "desc" }, take: 20 },
} as const;
const assignedWhere = (userId: string) => ({
  assignments: { some: { userId, active: true } },
});

router.get(
  "/workspace",
  asyncHandler(async (req, res) => {
    const clinician = await prisma.clinician.findUnique({
      where: { userId: req.user!.id },
    });
    const where = req.user!.roles.includes(Role.ADMIN)
      ? {}
      : assignedWhere(req.user!.id);
    const patients = await prisma.patient.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        appointments: {
          where: {
            startsAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(24, 0, 0, 0)),
            },
          },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
        assessments: {
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { adhd: { include: { titrationPlans: true } } },
        },
        reports: { where: { status: "REVIEW_REQUIRED" }, take: 1 },
        prescriptions: {
          where: { status: { in: ["PENDING_SIGNATURE", "DRAFT"] } },
          take: 5,
          include: { items: true },
          orderBy: { updatedAt: "desc" },
        },
        messageThreads: {
          where: { messages: { some: { senderId: { not: req.user!.id } } } },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    const earnings = clinician
      ? await prisma.revenueEvent.groupBy({
          by: ["serviceLine"],
          where: { clinicianId: clinician.id, type: "PAYMENT_RECEIVED" },
          _sum: { amountPence: true },
          _count: { id: true },
        })
      : [];
    res.json({ totalPatients: patients.length, patients, earnings });
  }),
);
router.get(
  "/patients/:patientId",
  asyncHandler(async (req, res) => {
    const allowed =
      req.user!.roles.includes(Role.ADMIN) ||
      (await prisma.patientAssignment.findFirst({
        where: {
          patientId: String(req.params.patientId),
          userId: req.user!.id,
          active: true,
        },
      }));
    if (!allowed) throw notFound("Assigned patient not found");
    const patient = await prisma.patient.findUnique({
      where: { id: String(req.params.patientId) },
      include: patientInclude,
    });
    if (!patient) throw notFound("Patient not found");
    res.json(patient);
  }),
);
router.post(
  "/prescriptions/:id/sign",
  requireRole(Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER),
  audit("PRESCRIPTION_SIGNED", "Prescription"),
  asyncHandler(async (req, res) => {
    const prescription = await prisma.prescription.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!prescription) throw notFound("Prescription not found");
    if (!req.user!.roles.includes(Role.ADMIN)) {
      const assignment = await prisma.patientAssignment.findFirst({
        where: {
          patientId: prescription.patientId,
          userId: req.user!.id,
          active: true,
        },
      });
      if (!assignment) throw notFound("Assigned prescription not found");
    }
    if (prescription.status !== PrescriptionStatus.PENDING_SIGNATURE)
      throw badRequest("Only prescriptions awaiting signature can be signed");
    const signedAt = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.prescription.update({
        where: { id: prescription.id },
        data: { status: PrescriptionStatus.SIGNED, issuedAt: signedAt },
      });
      await tx.prescriptionStatusEvent.create({
        data: {
          prescriptionId: prescription.id,
          status: PrescriptionStatus.SIGNED,
          metadata: { actorId: req.user!.id },
        },
      });
      return updated;
    });
    res.json(result);
  }),
);
router.post(
  "/patients/:patientId/follow-ups",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        dueAt: z.coerce.date(),
        title: z.string().trim().min(1).max(200),
      })
      .parse(req.body);
    const clinician = await prisma.clinician.findUnique({
      where: { userId: req.user!.id },
    });
    if (!clinician) throw notFound("Clinician profile not found");
    const task = await prisma.clinicalTask.create({
      data: {
        patientId: String(req.params.patientId),
        clinicianId: clinician.id,
        assignedToId: req.user!.id,
        type: TaskType.PENDING_NOTE,
        title: body.title,
        dueAt: body.dueAt,
      },
    });
    res.status(201).json(task);
  }),
);
router.post(
  "/patients/:patientId/titration-plans",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        assessmentId: z.string().cuid(),
        targetMedication: z.string().max(200).optional(),
        reviewIntervalDays: z.number().int().min(1).max(365).optional(),
        startDate: z.coerce.date().optional(),
      })
      .parse(req.body);
    const clinician = await prisma.clinician.findUnique({
      where: { userId: req.user!.id },
    });
    if (!clinician) throw notFound("Clinician profile not found");
    const plan = await prisma.titrationPlan.create({
      data: {
        adhdAssessmentId: body.assessmentId,
        clinicianId: clinician.id,
        status: TitrationStatus.PLANNED,
        targetMedication: body.targetMedication,
        reviewIntervalDays: body.reviewIntervalDays,
        startDate: body.startDate,
      },
    });
    res.status(201).json(plan);
  }),
);
export default router;
