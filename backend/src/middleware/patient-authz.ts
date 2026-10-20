import type { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../shared/db.js";
import { assertPatientAccess } from "../services/patient-authz.service.js";
import { unauthorized, forbidden, notFound } from "../shared/errors.js";

/**
 * Extracts a patientId from route params, query, or body.
 *
 * Only an explicitly named `patientId` is accepted. A generic `:id` is NOT
 * treated as a patient id, because many routes use `:id` for a different
 * resource (a document, a request) and resolving those as patient ids would
 * either deny legitimate access or, worse, authorise against the wrong record.
 * Routes that own a differently-named patient id must check ownership in the
 * handler against the resource's own patientId.
 */
function extractPatientId(req: {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: unknown;
}): string | undefined {
  const fromParams = req.params.patientId;
  const param =
    typeof fromParams === "string"
      ? fromParams
      : Array.isArray(fromParams)
        ? String(fromParams[0])
        : undefined;
  if (param) return param;

  const fromQuery = req.query.patientId;
  const query =
    typeof fromQuery === "string"
      ? fromQuery
      : Array.isArray(fromQuery)
        ? String(fromQuery[0])
        : undefined;
  if (query) return query;

  const body = req.body as Record<string, unknown> | undefined;
  const fromBody = body?.patientId;
  return typeof fromBody === "string" ? fromBody : undefined;
}

/**
 * Express middleware enforcing cross-patient isolation (IDOR/BOLA protection).
 *
 * Resolves the patientId from the request and asserts the authenticated user
 * may access that patient. Use on every patient-scoped route.
 *
 * When no patientId is present on the request, the middleware is a no-op —
 * callers should combine it with `requireRole` where role-based gating is needed.
 *
 * @param source - where to read the patientId from: "params", "query", "body", or "any" (default)
 */
export function requirePatientAccess(
  source: "params" | "query" | "body" | "any" = "any",
): RequestHandler {
  return async (req, res, next) => {
    if (!req.user) return next(unauthorized());

    const patientId = extractPatientId(req);
    if (!patientId) {
      // Nothing to isolate on this request.
      return next();
    }

    try {
      await assertPatientAccess(req.user.id, req.user.roles, patientId);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware for patient-owned routes (e.g. /me). Resolves the actor's Patient
 * record and binds req.patientId for downstream handlers. Clinical staff and
 * admin pass through unchanged (they gate via requireRole separately).
 */
export const requireOwnPatient: RequestHandler = async (req, res, next) => {
  if (!req.user) return next(unauthorized());

  const clinicalRoles: Role[] = [Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE];
  const isClinicalOrAdmin =
    req.user.roles.includes(Role.ADMIN) ||
    req.user.roles.some((r) => clinicalRoles.includes(r));
  if (isClinicalOrAdmin) return next();

  if (!req.user.roles.includes(Role.PATIENT))
    return next(forbidden());

  const patient = await prisma.patient.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!patient) return next(notFound("Patient profile not found"));

  (req as { patientId?: string }).patientId = patient.id;
  next();
};

