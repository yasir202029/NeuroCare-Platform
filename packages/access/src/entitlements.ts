export const plans = ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
export type Plan = (typeof plans)[number];
export const planEntitlements: Record<Plan, Readonly<Record<string, boolean | number>>> = {
  STARTER: { clinics: 1, clinicians: 5, patientPortal: false, aiReports: false, whiteLabel: false, apiAccess: false, advancedAnalytics: false },
  PROFESSIONAL: { clinics: 1, clinicians: Infinity, patientPortal: true, aiReports: true, whiteLabel: false, apiAccess: false, advancedAnalytics: false },
  ENTERPRISE: { clinics: Infinity, clinicians: Infinity, patientPortal: true, aiReports: true, whiteLabel: true, apiAccess: true, advancedAnalytics: true },
};
export function isEntitled(plan: Plan, key: string) { return planEntitlements[plan][key] === true; }
