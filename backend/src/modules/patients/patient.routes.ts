import { Router } from "express";
import { z } from "zod";
import { audit } from "../../middleware/audit.js";
import {
  clinicalStaffRoles,
  requireAuth,
  requireRole,
} from "../../middleware/auth.js";
import { asyncHandler } from "../../shared/http.js";
import { prisma } from "../../shared/db.js";
import { notFound } from "../../shared/errors.js";

const router = Router();
router.use(requireAuth);

/** Paginated patient directory (clinical staff only). Patients may only fetch their own via /me. */
router.get(
  "/",
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        take: z.coerce.number().int().min(1).max(200).default(50),
        skip: z.coerce.number().int().min(0).default(0),
        search: z.string().max(200).optional(),
      })
      .parse(req.query);

    const where = query.search
      ? {
          OR: [
            { user: { email: { contains: query.search, mode: "insensitive" as const } } },
            { user: { firstName: { contains: query.search, mode: "insensitive" as const } } },
            { user: { lastName: { contains: query.search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: query.take,
        skip: query.skip,
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({ patients, total, take: query.take, skip: query.skip });
  }),
);

const profile = z.object({
  nhsNumber: z
    .string()
    .regex(/^\d{10}$/)
    .optional(),
  dateOfBirth: z.coerce.date().optional(),
  sexAtBirth: z.string().max(50).optional(),
  gender: z.string().max(80).optional(),
  address: z.record(z.string(), z.string()).optional(),
  emergencyContact: z.record(z.string(), z.string()).optional(),
  preferredContact: z.string().max(30).optional(),
  consentToContact: z.boolean().optional(),
  medicalHistory: z.string().max(10000).optional(),
  currentMedication: z.array(z.record(z.string(), z.string())).optional(),
  accessibilityNeeds: z.string().max(2000).optional(),
});

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
    if (!patient) throw notFound("Patient profile not found");
    res.json(patient);
  }),
);
router.patch(
  "/me",
  audit("PATIENT_PROFILE_UPDATED", "Patient"),
  asyncHandler(async (req, res) => {
    const body = profile.parse(req.body);
    const patient = await prisma.patient.update({
      where: { userId: req.user!.id },
      data: body,
    });
    res.json(patient);
  }),
);
router.get(
  "/:id",
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const patientId = typeof req.params.id === 'string' ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : '';
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true, phone: true },
        },
        assessments: true,
        appointments: true,
      },
    });
    if (!patient) throw notFound("Patient not found");
    res.json(patient);
  }),
);

router.get(
  "/documents/:id/download",
  asyncHandler(async (req, res) => {
    const documentId = typeof req.params.id === 'string' ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : '';
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
    if (!document) throw notFound("Document not found");
    const userId = req.user!.id;
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient || document.patientId !== patient.id) throw notFound("Document not found");
    await prisma.documentAccessLog.create({
      data: {
        documentId,
        actorId: req.user!.id,
        action: "DOWNLOAD",
        ipAddress: req.ip,
      },
    });
    const content = `Document: ${document.name}\nType: ${document.type}\nMime: ${document.mimeType}\nSize: ${document.sizeBytes} bytes\nCreated: ${document.createdAt}\nPatient: ${document.patient.user.firstName} ${document.patient.user.lastName}\n\n---\nThis is a placeholder download. Actual file storage integration required.`;
    res.setHeader("Content-Disposition", `attachment; filename="${document.name}"`);
    res.setHeader("Content-Type", document.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", String(Buffer.byteLength(content)));
    res.send(content);
  }),
);

export default router;
