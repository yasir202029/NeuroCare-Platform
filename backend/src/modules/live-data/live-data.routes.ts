import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requirePatientAccess } from '../../middleware/patient-authz.js';
import { asyncHandler } from '../../shared/http.js';
import { LiveDataService } from './live-data.service.js';
import { audit } from '../../middleware/audit.js';
import { notFound } from '../../shared/errors.js';

export function createLiveDataRouter(service: LiveDataService) {
  const router = Router();

const vitalReadingSchema = z.object({
  type: z.enum(['HEART_RATE', 'BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC', 'TEMPERATURE', 'OXYGEN_SATURATION', 'RESPIRATORY_RATE', 'WEIGHT', 'SLEEP_HOURS']),
  value: z.number(),
  unit: z.string(),
  deviceId: z.string().optional(),
  notes: z.string().optional(),
});

const symptomEntrySchema = z.object({
  symptom: z.string().min(1),
  severity: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL']),
  notes: z.string().optional(),
});

const medicationAdherenceSchema = z.object({
  medication: z.string().min(1),
  dose: z.string().optional(),
  status: z.enum(['TAKEN', 'MISSED', 'LATE', 'REFUSED']),
  takenAt: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  sideEffects: z.string().optional(),
});

const wearableDataSchema = z.object({
  deviceId: z.string().min(1),
  patientId: z.string().cuid().optional(),
  dataType: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  recordedAt: z.string().optional(),
});

// Patient live data ingestion
router.post(
  '/patients/:patientId/vitals',
  requireRole(...[Role.PATIENT, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
  requirePatientAccess('params'),
  audit('LIVE_VITALS_INGESTED', 'PatientVitalSigns'),
  asyncHandler(async (req, res) => {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const body = z.object({ readings: z.array(vitalReadingSchema), source: z.string().optional() }).parse(req.body);
    const result = await service.ingestVitalSigns(patientId, body.readings, body.source ?? 'manual');
    res.status(201).json(result);
  }),
);

router.post(
  '/patients/:patientId/symptoms',
  requireRole(...[Role.PATIENT, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
  requirePatientAccess('params'),
  audit('LIVE_SYMPTOM_LOGGED', 'PatientSymptomEntry'),
  asyncHandler(async (req, res) => {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const body = symptomEntrySchema.parse(req.body);
    const result = await service.ingestSymptom(patientId, body, 'patient');
    res.status(201).json(result);
  }),
);

router.post(
  '/patients/:patientId/adherence',
  requireRole(...[Role.PATIENT, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
  requirePatientAccess('params'),
  audit('LIVE_ADHERENCE_LOGGED', 'MedicationAdherenceLog'),
  asyncHandler(async (req, res) => {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const body = medicationAdherenceSchema.parse(req.body);
    const result = await service.ingestMedicationAdherence(patientId, body, 'patient_app');
    res.status(201).json(result);
  }),
);

router.post(
  '/wearable/data',
  requireRole(...[Role.PATIENT, Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
  audit('WEARABLE_DATA_INGESTED', 'WearableDataPoint'),
  asyncHandler(async (req, res) => {
    const body = wearableDataSchema.parse(req.body);
    // Find patient by deviceId or use patientId from body if provided
    const result = await service.ingestWearableData(
      body.deviceId,
      body.patientId ?? '', // will be resolved by device lookup
      body.dataType,
      body.value,
      body.unit,
      body.recordedAt,
    );
    res.status(201).json(result);
  }),
);

// Patient live dashboard
router.get(
  '/patients/:patientId/live-dashboard',
  requireAuth,
  requirePatientAccess('params'),
  asyncHandler(async (req, res) => {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const dashboard = await service.getPatientLiveDashboard(patientId);
    res.json(dashboard);
  }),
);

// Clinical alerts
router.get(
  '/alerts/active',
  requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
  asyncHandler(async (_req, res) => {
    const alerts = await service.getAllActiveAlerts();
    res.json(alerts);
  }),
);

router.patch(
  '/alerts/:alertId/acknowledge',
  requireRole(...[Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN]),
  audit('CLINICAL_ALERT_ACKNOWLEDGED', 'ClinicalAlert'),
  asyncHandler(async (req, res) => {
    const alertId = Array.isArray(req.params.alertId) ? req.params.alertId[0] : req.params.alertId;
    const result = await service.acknowledgeAlert(alertId, req.user!.id);
    res.json(result);
  }),
);

// Stream events
router.get(
  '/stream/events/unprocessed',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? z.coerce.number().int().positive().parse(req.query.limit) : 100;
    const events = await service.getUnprocessedEvents(limit);
    res.json(events);
  }),
);

router.post(
  '/stream/events/processed',
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const body = z.object({ eventIds: z.array(z.string()) }).parse(req.body);
    const result = await service.markEventsProcessed(body.eventIds);
    res.json(result);
  }),
);
  return router;
}

export default createLiveDataRouter(new LiveDataService());
