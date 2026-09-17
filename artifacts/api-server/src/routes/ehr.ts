import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const noteTypes = new Set(["assessment", "progress", "medication_review", "risk_review"]);
const instruments = new Set(["ASRS", "AQ10", "AQ50", "CAT_Q", "PHQ9", "GAD7", "WSAS", "SNAP_IV", "CONNERS", "SDQ", "WURS"]);
function validClinicalNote(value: unknown): value is { noteType: string; body: string; occurredAt?: string } {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return typeof body.noteType === "string" && noteTypes.has(body.noteType) && typeof body.body === "string" && body.body.length > 0 && body.body.length <= 50_000 && (body.occurredAt === undefined || typeof body.occurredAt === "string");
}
function validAssessmentResponse(value: unknown): value is { instrument: string; answers: number[] } {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return typeof body.instrument === "string" && instruments.has(body.instrument) && Array.isArray(body.answers) && body.answers.length > 0 && body.answers.length <= 200 && body.answers.every((answer) => typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer <= 8);
}

router.get("/ehr/patients/:patientId", requirePermission("patient:read"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  auditEvent(req, res, "ehr.patient.read", "patient", req.params.patientId);
  // Database repository will enforce patient ownership once migration 0001 is applied.
  return res.status(501).json({ error: "EHR storage has not been connected. Apply the clinical platform migration before enabling records." });
});

router.post("/ehr/patients/:patientId/clinical-notes", requirePermission("clinical:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  if (!validClinicalNote(req.body)) return res.status(400).json({ error: "Invalid clinical note payload." });
  auditEvent(req, res, "ehr.clinical_note.create", "patient", req.params.patientId);
  return res.status(501).json({ error: "EHR storage has not been connected. Apply the clinical platform migration before enabling records.", requestId: randomUUID() });
});

router.post("/ehr/patients/:patientId/assessments", requirePermission("assessment:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  if (!validAssessmentResponse(req.body)) return res.status(400).json({ error: "Invalid assessment response payload." });
  auditEvent(req, res, "ehr.assessment_response.create", "patient", req.params.patientId);
  return res.status(501).json({ error: "Assessment storage has not been connected. Apply the clinical platform migration before enabling responses.", requestId: randomUUID() });
});

export default router;
