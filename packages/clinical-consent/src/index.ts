export const consentPurposes = ["CONSULTATION_RECORDING", "AI_CLINICAL_ASSISTANCE"] as const;
export type ConsentPurpose = (typeof consentPurposes)[number];
export type ConsentDecision = "GRANTED" | "DECLINED" | "WITHDRAWN";
export type ConsentStatus = { purpose: ConsentPurpose; decision: ConsentDecision; decidedAt: string; version: string };
export const careRequestTypes = ["MEDICATION_REFILL", "FOLLOW_UP", "MEDICATION_REVIEW"] as const;
export type CareRequestType = (typeof careRequestTypes)[number];
export function mayRecordOrUseAi(statuses: readonly ConsentStatus[], purpose: ConsentPurpose) { return statuses.some((status) => status.purpose === purpose && status.decision === "GRANTED"); }
