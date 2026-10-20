import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { audit } from '../../middleware/audit.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requirePatientAccess } from '../../middleware/patient-authz.js';
import { assertPatientAccess } from '../../services/patient-authz.service.js';
import { badRequest, notFound } from '../../shared/errors.js';

const router = Router();
router.use(requireAuth);

const clinicalStaffRoles = [Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

router.post(
  '/upload',
  requireRole(...clinicalStaffRoles, Role.PATIENT),
  requirePatientAccess('body'),
  audit('DOCUMENT_UPLOADED', 'Document'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      patientId: z.string().cuid(),
      name: z.string().min(1).max(255),
      mimeType: z.string().min(1).max(100),
      sizeBytes: z.number().int().positive().max(MAX_SIZE),
      type: z.enum(['CONSENT', 'REPORT', 'LETTER', 'UPLOAD', 'OTHER']).default('UPLOAD'),
      content: z.string().optional(), // base64
    }).parse(req.body);

    if (!ALLOWED_MIME.includes(body.mimeType)) throw badRequest('Unsupported file type');

    const document = await prisma.document.create({
      data: {
        patientId: body.patientId,
        type: body.type as any,
        name: body.name,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
      },
    });

    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        storageProvider: 'inline',
        storageBucket: 'local',
        storagePath: `documents/${document.id}/v1`,
        uploadedById: req.user!.id,
      },
    });

    res.status(201).json({ document });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id[0]);
    const document = await prisma.document.findUnique({
      where: { id },
      include: { versions: true, accessLogs: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!document) throw notFound('Document not found');
    // The document id is not a patient id, so ownership is checked against the
    // document's own patient rather than through the generic middleware.
    await assertPatientAccess(req.user!.id, req.user!.roles, document.patientId);
    await prisma.documentAccessLog.create({
      data: { documentId: id, actorId: req.user!.id, action: 'VIEW', ipAddress: req.ip },
    });
    res.json(document);
  }),
);

router.delete(
  '/:id',
  requireRole(...clinicalStaffRoles, Role.ADMIN),
  asyncHandler(async (req, res) => {
    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id[0]);
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw notFound('Document not found');
    await prisma.document.update({ where: { id }, data: { /* archive via updatedAt bump */ } });
    await prisma.documentAccessLog.create({
      data: { documentId: id, actorId: req.user!.id, action: 'DELETE', ipAddress: req.ip },
    });
    res.status(204).send();
  }),
);

export default router;
