import { Router } from "express";
import { z } from "zod";
import { NoteType, Role } from "@prisma/client";
import { prisma } from "../../shared/db.js";
import { asyncHandler } from "../../shared/http.js";
import { audit } from "../../middleware/audit.js";
import {
  clinicalStaffRoles,
  requireAuth,
  requireRole,
} from "../../middleware/auth.js";
import { requirePatientAccess } from "../../middleware/patient-authz.js";
import { notFound } from "../../shared/errors.js";

const router = Router();
router.use(requireAuth, requireRole(...clinicalStaffRoles));
router.post(
  "/",
  audit("CLINICAL_NOTE_CREATED", "ClinicalNote"),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        patientId: z.string().cuid(),
        appointmentId: z.string().cuid().optional(),
        type: z.nativeEnum(NoteType),
        content: z.string().min(1).max(50000),
      })
      .parse(req.body);
    const clinician = await prisma.clinician.findUnique({
      where: { userId: req.user!.id },
    });
    if (!clinician && !req.user!.roles.includes(Role.ADMIN))
      throw notFound("Clinician profile not found");
    res.status(201).json(
      await prisma.clinicalNote.create({
        data: { ...body, clinicianId: clinician?.id ?? req.user!.id },
      }),
    );
  }),
);
router.patch(
  "/:id/sign",
  audit("CLINICAL_NOTE_SIGNED", "ClinicalNote"),
  asyncHandler(async (req, res) => {
    res.json(
      await prisma.clinicalNote.update({
        where: { id: typeof req.params.id === 'string' ? req.params.id : String((req.params.id as string[])[0]) },
        data: { signedAt: new Date() },
      }),
    );
  }),
);
router.get(
  "/patient/:patientId",
  requirePatientAccess("params"),
  asyncHandler(async (req, res) => {
    const patientId =
      typeof req.params.patientId === "string"
        ? req.params.patientId
        : Array.isArray(req.params.patientId)
          ? String(req.params.patientId[0])
          : "";
    res.json(
      await prisma.clinicalNote.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        include: {
          clinician: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          attachments: true,
        },
      }),
    );
  }),
);
export default router;
