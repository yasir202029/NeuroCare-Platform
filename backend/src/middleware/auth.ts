import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../shared/db.js";
import { config } from "../shared/config.js";
import { forbidden, unauthorized, notFound } from "../shared/errors.js";
import type { AuthenticatedUser } from "../shared/types.js";

type Claims = {
  sub: string;
  email: string;
  roles: Role[];
  type: "access" | "refresh";
};

export const clinicalStaffRoles = [
  Role.ADMIN,
  Role.PSYCHIATRIST,
  Role.PRESCRIBER,
  Role.NURSE,
] as const;

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  const accessCookie = req
    .header("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("neurocare_access="))
    ?.slice("neurocare_access=".length);
  const token = header?.startsWith("Bearer ") ? header.slice(7) : accessCookie;
  if (!token) return next(unauthorized());
  try {
    const claims = jwt.verify(token, config.JWT_ACCESS_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    }) as Claims;
    if (claims.type !== "access") return next(unauthorized());
    req.user = {
      id: claims.sub,
      email: claims.email,
      roles: claims.roles,
    } satisfies AuthenticatedUser;
    next();
  } catch {
    next(unauthorized("Invalid or expired access token"));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.some((role) => req.user?.roles.includes(role)))
      return next(forbidden());
    next();
  };

export type PortalName =
  "patient" | "clinician" | "admin" | "finance" | "prescriber" | "nurse";

const portalRoles: Record<PortalName, Role[]> = {
  patient: [Role.PATIENT],
  clinician: [Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE],
  admin: [Role.ADMIN],
  finance: [Role.ADMIN, Role.FINANCE],
  prescriber: [Role.ADMIN, Role.PSYCHIATRIST, Role.PRESCRIBER],
  nurse: [Role.ADMIN, Role.NURSE],
};

export const requirePortal =
  (portal: PortalName): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!portalRoles[portal].some((role) => req.user!.roles.includes(role)))
      return next(forbidden(`You do not have access to the ${portal} portal`));
    next();
  };

export const portalsForRoles = (roles: Role[]) =>
  (Object.keys(portalRoles) as PortalName[]).filter((portal) =>
    portalRoles[portal].some((role) => roles.includes(role)),
  );

export const requirePatientOrStaff: RequestHandler = async (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (
    req.user.roles.some((role) =>
      ([
        Role.ADMIN,
        Role.PSYCHIATRIST,
        Role.PRESCRIBER,
        Role.NURSE,
        Role.FINANCE,
      ] as Role[]).includes(role),
    )
  )
    return next();
  if (req.user.roles.includes(Role.PATIENT)) {
    // Resolve the Patient record linked to this user and compare Patient.id,
    // not User.id (a patient's userId and patient.id are different cuid values).
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    const patientId = typeof req.params.patientId === "string" ? req.params.patientId : Array.isArray(req.params.patientId) ? String(req.params.patientId[0]) : undefined;
    if (patient && patientId && patient.id === patientId) return next();
    if (!patientId) return next();
  }
  next(forbidden());
};
