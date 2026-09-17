import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { auditEvent } from "../security/audit";
import { requirePermission } from "../security/auth";

const router: IRouter = Router();
const appointmentTypes = new Set(["ADHD_ASSESSMENT", "AUTISM_ASSESSMENT", "FOLLOW_UP", "MEDICATION_REVIEW"]);
const questionnaireSets = new Set(["ADHD", "AUTISM"]);
const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

router.post("/appointment-intake", requirePermission("appointment:manage"), (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.appointmentType !== "string" || !appointmentTypes.has(body.appointmentType) || typeof body.preferredDate !== "string" || typeof body.contactPreference !== "string" || typeof body.reasonForAppointment !== "string" || body.reasonForAppointment.trim().length === 0 || body.reasonForAppointment.length > 2000) return res.status(400).json({ error: "Complete the required appointment intake information." });
  auditEvent(req, res, "appointment_intake.create.request", "appointment");
  return res.status(503).json({ error: "Appointment intake is unavailable until tenant-scoped storage is connected.", code: "CLINICAL_STORAGE_UNAVAILABLE", requestId: randomUUID() });
});

router.post("/appointments/:appointmentId/clinician-assignment", requirePermission("appointment:manage"), (req, res) => {
  if (!isUuid(req.params.appointmentId)) return res.status(400).json({ error: "Invalid appointment identifier." });
  const body = req.body as Record<string, unknown>;
  if (!isUuid(body.clinicianId) || (body.questionnaireSet !== undefined && (typeof body.questionnaireSet !== "string" || !questionnaireSets.has(body.questionnaireSet)))) return res.status(400).json({ error: "A valid clinician and optional questionnaire set are required." });
  auditEvent(req, res, "appointment.clinician_assign.request", "appointment", req.params.appointmentId);
  return res.status(503).json({ error: "Clinician assignment is unavailable until tenant-scoped storage is connected.", code: "CLINICAL_STORAGE_UNAVAILABLE", requestId: randomUUID() });
});

router.get("/clinician/appointments/:appointmentId/intake", requirePermission("appointment:manage"), (req, res) => {
  if (!isUuid(req.params.appointmentId)) return res.status(400).json({ error: "Invalid appointment identifier." });
  auditEvent(req, res, "appointment_intake.read", "appointment", req.params.appointmentId);
  return res.status(503).json({ error: "Appointment intake is unavailable until tenant-scoped storage and clinician-assignment checks are connected.", code: "CLINICAL_STORAGE_UNAVAILABLE" });
});
export default router;
