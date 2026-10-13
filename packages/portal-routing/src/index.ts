export type PortalRole = "SUPER_ADMIN" | "ADMIN" | "CLINICIAN" | "PATIENT" | "FINANCE" | "RECEPTIONIST" | "SUPPORT_AGENT";
export type PortalUrls = { patient: string; clinician: string; admin: string; system: string };
export function portalForRole(role: PortalRole, urls: PortalUrls) {
  if (role === "PATIENT") return urls.patient;
  if (role === "CLINICIAN") return urls.clinician;
  if (role === "SUPER_ADMIN") return urls.system;
  return urls.admin;
}
