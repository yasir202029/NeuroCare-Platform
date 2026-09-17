export const roles = ["SUPER_ADMIN","ADMIN","CLINICIAN","PATIENT","FINANCE","RECEPTIONIST","SUPPORT"] as const; export type Role = (typeof roles)[number]; export const portalAccess = { patient: ["PATIENT"], clinician: ["CLINICIAN"], admin: ["ADMIN","FINANCE","RECEPTIONIST","SUPPORT","SUPER_ADMIN"], system: ["SUPER_ADMIN"] } as const;
export * from "./entitlements";
