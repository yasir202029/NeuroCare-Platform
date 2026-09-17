export const platformRoles = [
  "SUPER_ADMIN", "ADMIN", "CLINICIAN", "PATIENT", "RECEPTIONIST",
  "FINANCE", "REFERRER", "CORPORATE_CLIENT", "SUPPORT_AGENT",
] as const;

export type PlatformRole = (typeof platformRoles)[number];

export const permissions = [
  "platform:manage", "clinic:manage", "user:manage", "patient:read", "patient:write",
  "assessment:read", "assessment:write", "clinical:write", "appointment:manage",
  "billing:read", "billing:write", "document:read", "document:write", "message:write",
  "audit:read", "ai:use", "ai:manage",
] as const;
export type Permission = (typeof permissions)[number];

const grants: Record<PlatformRole, readonly Permission[]> = {
  SUPER_ADMIN: permissions,
  ADMIN: ["clinic:manage", "user:manage", "patient:read", "patient:write", "assessment:read", "assessment:write", "appointment:manage", "billing:read", "billing:write", "document:read", "document:write", "message:write", "audit:read"],
  CLINICIAN: ["patient:read", "patient:write", "assessment:read", "assessment:write", "clinical:write", "appointment:manage", "document:read", "document:write", "message:write", "ai:use"],
  PATIENT: ["patient:read", "patient:write", "appointment:manage", "document:read", "document:write", "message:write"],
  RECEPTIONIST: ["patient:read", "patient:write", "appointment:manage", "document:read", "message:write"],
  FINANCE: ["patient:read", "billing:read", "billing:write"],
  REFERRER: ["assessment:read", "document:read", "message:write"],
  CORPORATE_CLIENT: ["assessment:read", "document:read", "message:write"],
  SUPPORT_AGENT: ["patient:read", "appointment:manage", "document:read", "message:write"],
};

export function hasPermission(role: PlatformRole, permission: Permission) {
  return grants[role].includes(permission);
}
