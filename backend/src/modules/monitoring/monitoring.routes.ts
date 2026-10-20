import { Router } from "express";
import { z } from "zod";
import { RiskDomain, RiskLevel, RiskReviewStatus, Role } from "@prisma/client";
import { asyncHandler } from "../../shared/http.js";
import { audit, recordAuditEvent } from "../../middleware/audit.js";
import {
  clinicalStaffRoles,
  requireAuth,
  requireRole,
} from "../../middleware/auth.js";
import { requirePatientAccess } from "../../middleware/patient-authz.js";
import {
  submitMonitoringReadings,
  getPatientMonitoringHistory,
  listOpenMonitoringAlerts,
  acknowledgeMonitoringAlert,
} from "../../services/monitoring.service.js";
import {
  createRiskEntry,
  getPatientRiskRecords,
  updateRiskReviewStatus,
} from "../../services/risk.service.js";

const router = Router();
router.use(requireAuth);

const getParamsPatientId = (req: { params: Record<string, unknown> }): string =>
  z.string().cuid().parse(req.params.patientId);

// ── Monitoring alert review queue (clinician) ────────────────────────────

router.get(
  "/alerts",
  requireRole(...clinicalStaffRoles),
  asyncHandler(async (req, res) => {
    const queue = await listOpenMonitoringAlerts(req.user!.id, req.user!.roles);
    res.json(queue);
  }),
);

router.post(
  "/alerts/:id/acknowledge",
  requireRole(...clinicalStaffRoles),
  audit("PHYSICAL_HEALTH_ALERT_ACKNOWLEDGED", "PhysicalHealthAlert"),
  asyncHandler(async (req, res) => {
    const alertId = z.string().cuid().parse(req.params.id);
    const result = await acknowledgeMonitoringAlert(alertId, req.user!.id, req.user!.roles);
    res.json(result);
  }),
);

// ── Monitoring (patient self-submit) ──────────────────────────────────────

router.post(
  "/monitoring/:patientId/review",
  requireRole(...clinicalStaffRoles, Role.PATIENT),
  requirePatientAccess("params"),
  asyncHandler(async (req, res) => {
    const patientId = getParamsPatientId(req);

    const bodySchema = z.strictObject({
      bloodPressureSystolic: z.number().int().min(40).max(300).optional(),
      bloodPressureDiastolic: z.number().int().min(20).max(200).optional(),
      pulse: z.number().int().min(20).max(250).optional(),
      weightKg: z.number().positive().max(500).optional(),
      heightCm: z.number().positive().max(300).optional(),
      bmi: z.number().min(5).max(100).optional(),
      sleepHours: z.number().min(0).max(24).optional(),
      appetite: z.string().max(2000).optional(),
      sideEffects: z.string().max(5000).optional(),
      notes: z.string().max(5000).optional(),
    });
    const body = bodySchema.parse(req.body);

    const result = await submitMonitoringReadings(patientId, req.user!.id, body);

    // Audited after creation so the event points at the review that was written.
    await recordAuditEvent({
      actorId: req.user!.id,
      action: "PHYSICAL_HEALTH_REVIEW_SUBMITTED",
      resource: "PhysicalHealthReview",
      resourceId: result.review.id,
      req,
    });

    res.status(201).json({
      reviewId: result.review.id,
      alertCount: result.alertCount,
      alerts: result.alerts,
      recordedAt: result.review.reviewDate,
    });
  }),
);

router.get(
  "/monitoring/:patientId",
  requireRole(...clinicalStaffRoles, Role.PATIENT),
  requirePatientAccess("params"),
  asyncHandler(async (req, res) => {
    const patientId = getParamsPatientId(req);
    const history = await getPatientMonitoringHistory(
      patientId,
      req.user!.id,
      req.user!.roles,
    );
    res.json(history);
  }),
);

// ── Risk/Safeguarding (clinician) ────────────────────────────────────────

router.post(
  "/risk/:patientId",
  requireRole(...clinicalStaffRoles),
  requirePatientAccess("params"),
  asyncHandler(async (req, res) => {
    const patientId = getParamsPatientId(req);

    const bodySchema = z.strictObject({
      domain: z.nativeEnum(RiskDomain),
      currentRisk: z.nativeEnum(RiskLevel),
      historicalRisk: z.nativeEnum(RiskLevel).optional(),
      protectiveFactors: z.string().max(4000).nullish(),
      actions: z.string().max(4000).nullish(),
      notes: z.string().max(4000).nullish(),
      reviewStatus: z.nativeEnum(RiskReviewStatus).optional(),
    });
    const body = bodySchema.parse(req.body);

    const record = await createRiskEntry({
      patientId,
      domain: body.domain,
      currentRisk: body.currentRisk,
      historicalRisk: body.historicalRisk,
      protectiveFactors: body.protectiveFactors ?? null,
      actions: body.actions ?? null,
      notes: body.notes ?? null,
      reviewedBy: req.user!.id,
      reviewStatus: body.reviewStatus,
    });

    // Audited after creation so the event points at the entry that was written.
    await recordAuditEvent({
      actorId: req.user!.id,
      action: "CLINICAL_RISK_ENTRY_CREATED",
      resource: "ClinicalRiskEntry",
      resourceId: record.id,
      req,
    });

    res.status(201).json(record);
  }),
);

router.get(
  "/risk/:patientId",
  requireRole(...clinicalStaffRoles),
  requirePatientAccess("params"),
  asyncHandler(async (req, res) => {
    const patientId = getParamsPatientId(req);
    const records = await getPatientRiskRecords(
      patientId,
      req.user!.id,
      req.user!.roles,
    );
    res.json(records);
  }),
);

router.patch(
  "/risk/:patientId/:entryId/review-status",
  requireRole(...clinicalStaffRoles),
  requirePatientAccess("params"),
  audit("CLINICAL_RISK_REVIEW_STATUS_UPDATED", "ClinicalRiskEntry", "entryId"),
  asyncHandler(async (req, res) => {
    const patientId = getParamsPatientId(req);
    const entryId = z.string().cuid().parse(req.params.entryId);

    const bodySchema = z.strictObject({ reviewStatus: z.nativeEnum(RiskReviewStatus) });
    const body = bodySchema.parse(req.body);

    const result = await updateRiskReviewStatus(
      patientId,
      entryId,
      body.reviewStatus,
      req.user!.id,
      req.user!.roles,
    );
    res.json(result);
  }),
);

export default router;
