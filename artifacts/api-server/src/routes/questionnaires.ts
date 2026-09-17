import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const questionnaireTypes = new Set(["ASRS", "AQ10", "AQ50", "CAT_Q", "PHQ9", "GAD7", "WSAS", "SNAP_IV", "CONNERS", "SDQ", "WURS", "INFORMANT_REPORT"]);

router.post("/patients/:patientId/questionnaires", requirePermission("assessment:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (typeof body.questionnaireType !== "string" || !questionnaireTypes.has(body.questionnaireType) || typeof body.title !== "string" || body.title.trim().length === 0 || body.title.length > 200) return res.status(400).json({ error: "Invalid questionnaire assignment." });
  auditEvent(req, res, "questionnaire.assign", "patient", req.params.patientId);
  return res.status(503).json({ error: "Questionnaire service is unavailable until tenant-scoped storage is connected.", code: "CLINICAL_STORAGE_UNAVAILABLE", requestId: randomUUID() });
});

router.post("/patients/:patientId/informant-links", requirePermission("patient:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email) || typeof body.relationship !== "string" || body.relationship.trim().length === 0 || body.relationship.length > 100) return res.status(400).json({ error: "A valid informant email and relationship are required." });
  auditEvent(req, res, "informant_link.issue.request_by_patient", "patient", req.params.patientId);
  return res.status(503).json({ error: "Informant invitations are unavailable until signed-link delivery and tenant-scoped storage are configured.", code: "INFORMANT_LINKS_UNAVAILABLE", requestId: randomUUID() });
});

router.post("/informant/questionnaires/:token", (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!req.params.token || typeof body.answers !== "object" || body.answers === null) return res.status(400).json({ error: "Invalid questionnaire submission." });
  return res.status(503).json({ error: "Informant questionnaire submission is unavailable until signed-link verification and tenant-scoped storage are configured.", code: "INFORMANT_LINKS_UNAVAILABLE" });
});
export default router;
