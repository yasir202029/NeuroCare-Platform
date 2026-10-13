import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const purposes = new Set(["CONSULTATION_RECORDING", "AI_CLINICAL_ASSISTANCE"]);
const decisions = new Set(["GRANTED", "DECLINED", "WITHDRAWN"]);
const requestTypes = new Set(["MEDICATION_REFILL", "FOLLOW_UP", "MEDICATION_REVIEW"]);
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function storageUnavailable(res: Parameters<IRouter["get"]>[1] extends (...args: infer Args) => unknown ? Args[1] : never, area: string) {
  return res.status(503).json({ error: `${area} is not active until the approved database migrations and repository are connected.`, code: "CLINICAL_STORAGE_UNAVAILABLE" });
}
router.get("/patients/:patientId/consents", requirePermission("patient:read"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  auditEvent(req, res, "consent.read", "patient", req.params.patientId);
  return storageUnavailable(res, "Consent service");
});
router.post("/patients/:patientId/consents", requirePermission("patient:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (typeof body.purpose !== "string" || !purposes.has(body.purpose) || typeof body.decision !== "string" || !decisions.has(body.decision) || typeof body.policyVersion !== "string" || body.policyVersion.length > 100) return res.status(400).json({ error: "Invalid consent decision." });
  auditEvent(req, res, "consent.record", "patient", req.params.patientId);
  return storageUnavailable(res, "Consent service");
});
router.post("/patients/:patientId/care-requests", requirePermission("patient:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (typeof body.requestType !== "string" || !requestTypes.has(body.requestType) || typeof body.details !== "string" || body.details.trim().length === 0 || body.details.length > 2000) return res.status(400).json({ error: "Invalid care request." });
  auditEvent(req, res, "care_request.create", "patient", req.params.patientId);
  return res.status(503).json({ error: "Care request service is not active until the approved database migrations and repository are connected.", code: "CLINICAL_STORAGE_UNAVAILABLE", requestId: randomUUID() });
});
export default router;
