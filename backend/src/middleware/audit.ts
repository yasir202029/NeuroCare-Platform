import type { Request, RequestHandler } from 'express';
import { prisma } from '../shared/db.js';

type AuditableRequest = Pick<Request, 'ip' | 'method' | 'path'> & { requestId?: string };

const resourceIdOf = (raw: unknown): string | undefined =>
  typeof raw === 'string' ? raw : Array.isArray(raw) ? String(raw[0]) : undefined;

/**
 * Writes a single audit event.
 *
 * Used directly by route handlers that can only know the audited resource id
 * after the service call has run (e.g. a newly created clinical record); the
 * `audit` middleware below covers routes where the id is already in the path.
 */
export async function recordAuditEvent(options: {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  req: AuditableRequest;
}) {
  const rawIp: unknown = options.req.ip;
  const ip = Array.isArray(rawIp) ? String(rawIp[0]) : typeof rawIp === 'string' ? rawIp : undefined;
  await prisma.auditEvent.create({
    data: {
      actorId: options.actorId,
      action: options.action,
      resource: options.resource,
      resourceId: options.resourceId,
      ipAddress: ip,
      metadata: {
        method: options.req.method,
        path: options.req.path,
        requestId: options.req.requestId,
      },
    },
  });
}

/**
 * Record an audit event for the request.
 *
 * `idParam` names the route parameter that identifies the audited resource.
 * It defaults to `:id` and falls back to `:patientId` so existing routes keep
 * their current behaviour.
 */
export const audit = (action: string, resource: string, idParam = "id"): RequestHandler => async (req, _res, next) => {
  try {
    const params = req.params as Record<string, unknown>;
    const rawId = params[idParam] ?? params.id ?? params.patientId;
    await recordAuditEvent({
      actorId: req.user?.id,
      action,
      resource,
      resourceId: resourceIdOf(rawId),
      req,
    });
    next();
  } catch (error) { next(error); }
};
