import type { RequestHandler } from 'express';
import { prisma } from '../shared/db.js';

export const audit = (action: string, resource: string): RequestHandler => async (req, _res, next) => {
  try {
    const rawIp: unknown = (req as { ip?: unknown }).ip;
    const ip = Array.isArray(rawIp) ? String(rawIp[0]) : typeof rawIp === 'string' ? rawIp : undefined;
    const rawId = (req.params as Record<string, unknown>).id ?? (req.params as Record<string, unknown>).patientId;
    const resourceId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? String(rawId[0]) : undefined;
    await prisma.auditEvent.create({ data: { actorId: req.user?.id, action, resource, resourceId, ipAddress: ip, metadata: { method: req.method, path: req.path, requestId: req.requestId } } });
    next();
  } catch (error) { next(error); }
};
