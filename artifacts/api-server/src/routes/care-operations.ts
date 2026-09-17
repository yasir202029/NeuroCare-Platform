import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const phases = new Set(["REFERRAL","SCREENING","QUESTIONNAIRES","ASSESSMENT_BOOKED","ASSESSMENT_IN_PROGRESS","EVIDENCE_COLLECTION","CLINICAL_REVIEW","DIAGNOSIS_DECISION","REPORT_PREPARATION","REPORT_ISSUED","MEDICATION_ELIGIBILITY_REVIEW","TITRATION","STABLE_TREATMENT","SHARED_CARE","ANNUAL_REVIEW"]);
const requirements = new Set(["BLOOD_PRESSURE","HEART_RATE","WEIGHT","HEIGHT","ECG","BLOOD_TESTS","INFORMANT_REPORT","SCHOOL_REPORT","CONSENT_FORM","RISK_ASSESSMENT","SIDE_EFFECT_REVIEW","MEDICATION_EFFECTIVENESS_REVIEW"]);
const signalTypes = new Set(["SIDE_EFFECT","MEDICATION_CONCERN","SAFEGUARDING_CONCERN","URGENT_QUERY","COMPLAINT","PRESCRIPTION_ISSUE"]);
const priorities = new Set(["LOW","MEDIUM","HIGH","URGENT"]);
const unavailable = (res: import("express").Response, area: string) => res.status(503).json({ error: `${area} is unavailable until tenant-scoped storage, notifications, and audit persistence are connected.`, code: "CLINICAL_STORAGE_UNAVAILABLE" });

router.post("/patients/:patientId/journey", requirePermission("clinical:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (typeof body.phase !== "string" || !phases.has(body.phase)) return res.status(400).json({ error: "Invalid care phase." });
  auditEvent(req, res, "patient_journey.phase_change.request", "patient", req.params.patientId);
  return unavailable(res, "Patient journey");
});
router.post("/prescription-cases/:caseId/requirements", requirePermission("clinical:write"), (req, res) => {
  if (!isUuid(req.params.caseId)) return res.status(400).json({ error: "Invalid prescription case identifier." });
  const body = req.body as Record<string, unknown>;
  if (!Array.isArray(body.requirements) || body.requirements.length === 0 || body.requirements.some((item) => typeof item !== "string" || !requirements.has(item))) return res.status(400).json({ error: "Select one or more valid prescription requirements." });
  auditEvent(req, res, "prescription.requirements.request", "prescription_case", req.params.caseId);
  return unavailable(res, "Prescription requirements");
});
router.post("/patients/:patientId/signals", requirePermission("patient:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (typeof body.type !== "string" || !signalTypes.has(body.type) || typeof body.priority !== "string" || !priorities.has(body.priority) || typeof body.details !== "string" || body.details.trim().length === 0 || body.details.length > 2000) return res.status(400).json({ error: "Invalid patient concern." });
  auditEvent(req, res, "patient_signal.create.request", "patient", req.params.patientId);
  return unavailable(res, "Patient concern service");
});
router.post("/patients/:patientId/review-schedules", requirePermission("clinical:write"), (req, res) => {
  if (!isUuid(req.params.patientId)) return res.status(400).json({ error: "Invalid patient identifier." });
  const body = req.body as Record<string, unknown>;
  if (!(["MEDICATION","FOLLOW_UP","ANNUAL"] as string[]).includes(String(body.reviewType)) || typeof body.dueAt !== "string" || Number.isNaN(Date.parse(body.dueAt))) return res.status(400).json({ error: "A valid review type and due date are required." });
  auditEvent(req, res, "review_schedule.create.request", "patient", req.params.patientId);
  return unavailable(res, "Review scheduling");
});
router.get("/clinician/review-queue", requirePermission("clinical:write"), (req, res) => {
  auditEvent(req, res, "clinician.review_queue.read", "review_queue");
  return unavailable(res, "Clinician review queue");
});
router.post("/prescription-cases/:caseId/issue", requirePermission("clinical:write"), (req, res) => {
  if (!isUuid(req.params.caseId)) return res.status(400).json({ error: "Invalid prescription case identifier." });
  auditEvent(req, res, "prescription.issue.request", "prescription_case", req.params.caseId);
  return res.status(503).json({ error: "Prescription issuing requires configured prescribing governance, clinician approval, and audit persistence.", code: "PRESCRIBING_UNAVAILABLE", requestId: randomUUID() });
});
export default router;
