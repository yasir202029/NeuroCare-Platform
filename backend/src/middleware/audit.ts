import type { RequestHandler } from 'express';
import { prisma } from '../shared/db.js';

export const audit = (action: string, resource: string): RequestHandler => async (req, _res, next) => {
  try {
    await prisma.auditEvent.create({ data: { actorId: req.user?.id, action, resource, resourceId: req.params.id ?? req.params.patientId, ipAddress: req.ip, metadata: { method: req.method, path: req.path, requestId: req.requestId } } });
    next();
  } catch (error) { next(error); }
};
