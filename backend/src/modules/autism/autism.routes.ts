import { Router } from "express";
import { z } from "zod";
import { AssessmentStatus, AssessmentType, Prisma, ScreeningInstrument } from "@prisma/client";
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
const requireClinicalStaff = requireRole(...clinicalStaffRoles);
router.post(
  "/screening",
  audit("AUTISM_SCREENING_SUBMITTED", "ScreeningResponse"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        assessmentId: z.string().cuid().optional(),
        instrument: z.nativeEnum(ScreeningInstrument),
        formKey: z.string().min(1),
        version: z.string().min(1),
        answers: z.record(z.string(), z.unknown()),
      })
      .parse(req.body);
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patient) throw badRequest("Patient profile not found");
    res.status(201).json(
      await prisma.screeningResponse.create({
        data: { assessmentId: body.assessmentId, instrument: body.instrument, formKey: body.formKey, version: body.version, answers: body.answers as Prisma.InputJsonValue, patientId: patient.id },
      }),
    );
  }),
);
router.post(
  "/assessments",
  requireClinicalStaff,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        patientId: z.string().cuid(),
        clinicianId: z.string().cuid().optional(),
      })
      .parse(req.body);
    res.status(201).json(
      await prisma.assessment.create({
        data: {
          ...body,
          type: AssessmentType.AUTISM,
          autism: { create: {} },
        },
        include: { autism: true },
      }),
    );
  }),
);
router.patch(
  "/assessments/:id/workflow",
  requireClinicalStaff,
  audit("AUTISM_WORKFLOW_UPDATED", "Assessment"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        status: z.nativeEnum(AssessmentStatus),
        formulation: z.string().max(20000).optional(),
        recommendations: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(req.body);
    res.json(
      await prisma.assessment.update({
        where: { id: typeof req.params.id === 'string' ? req.params.id : String((req.params.id as string[])[0]), type: AssessmentType.AUTISM },
        data: { status: body.status, formulation: body.formulation, recommendations: body.recommendations as never },
        include: { autism: true },
      }),
    );
  }),
);
router.get(
  "/assessments/:id",
  asyncHandler(async (req, res) => {
    const getAssessmentId = typeof req.params.id === 'string' ? req.params.id : String((req.params.id as string[])[0]);
    const item = await prisma.assessment.findFirst({
      where: { id: getAssessmentId, type: AssessmentType.AUTISM },
      include: {
        screenings: true,
        autism: true,
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!item) throw notFound("Autism assessment not found");
    res.json(item);
  }),
);
export default router;
