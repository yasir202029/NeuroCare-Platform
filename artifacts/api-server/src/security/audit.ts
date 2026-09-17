import type { Request, Response } from "express";

/** Records are intentionally structured and exclude request bodies, tokens, and clinical free text. */
export function auditEvent(req: Request, _res: Response, action: string, resourceType: string, resourceId?: string) {
  req.log.info({ audit: true, actorId: req.user?.id, clinicId: req.user?.clinicId, action, resourceType, resourceId, method: req.method, path: req.path }, "audit event");
}
