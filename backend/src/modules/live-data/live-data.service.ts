import { Prisma, VitalType, SymptomSeverity, AdherenceStatus, AuditSeverity } from '@prisma/client';
import { prisma } from '../../shared/db.js';

type VitalReading = {
  type: VitalType;
  value: number;
  unit: string;
  deviceId?: string;
  notes?: string;
};

type SymptomEntry = {
  symptom: string;
  severity: SymptomSeverity;
  notes?: string;
};

type MedicationAdherence = {
  medication: string;
  dose?: string;
  status: AdherenceStatus;
  takenAt?: string;
  scheduledAt?: string;
  notes?: string;
  sideEffects?: string;
};

type InterpretationResult = {
  anomalies: Array<{
    type: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    data: Record<string, unknown>;
  }>;
  alerts: Array<{
    alertType: string;
    severity: AuditSeverity;
    title: string;
    message: string;
    triggerData: Record<string, unknown>;
  }>;
  insights: Array<{
    type: string;
    title: string;
    content: string;
    confidence: number;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
  }>;
};

type BroadcastFn = (patientId: string, message: unknown) => void;

export class LiveDataService {
  private broadcast: BroadcastFn;

  constructor(broadcast?: BroadcastFn) {
    this.broadcast = broadcast ?? (() => {});
  }
  /**
   * Ingest vital signs and interpret for anomalies
   */
  async ingestVitalSigns(patientId: string, readings: VitalReading[], source = 'manual') {
    const anomalies: InterpretationResult['anomalies'] = [];
    const alerts: InterpretationResult['alerts'] = [];
    const created: any[] = [];

    // Define normal ranges for ADHD-relevant vitals
    const normalRanges: Record<VitalType, { min: number; max: number; unit: string }> = {
      [VitalType.HEART_RATE]: { min: 60, max: 100, unit: 'bpm' },
      [VitalType.BLOOD_PRESSURE_SYSTOLIC]: { min: 90, max: 140, unit: 'mmHg' },
      [VitalType.BLOOD_PRESSURE_DIASTOLIC]: { min: 60, max: 90, unit: 'mmHg' },
      [VitalType.TEMPERATURE]: { min: 36.1, max: 37.2, unit: '°C' },
      [VitalType.OXYGEN_SATURATION]: { min: 95, max: 100, unit: '%' },
      [VitalType.RESPIRATORY_RATE]: { min: 12, max: 20, unit: 'breaths/min' },
      [VitalType.WEIGHT]: { min: 40, max: 120, unit: 'kg' },
      [VitalType.SLEEP_HOURS]: { min: 6, max: 10, unit: 'hours' },
    };

    for (const reading of readings) {
      const range = normalRanges[reading.type];
      let isAnomalous = false;
      let anomalyScore: number | undefined;

      if (range) {
        if (reading.value < range.min) {
          isAnomalous = true;
          anomalyScore = (range.min - reading.value) / range.min;
        } else if (reading.value > range.max) {
          isAnomalous = true;
          anomalyScore = (reading.value - range.max) / range.max;
        }
      }

      const vital = await prisma.patientVitalSigns.create({
        data: {
          patientId,
          type: reading.type,
          value: reading.value,
          unit: reading.unit,
          source,
          deviceId: reading.deviceId,
          notes: reading.notes,
          isAnomalous,
          anomalyScore,
        },
      });
      created.push(vital);

      if (isAnomalous && anomalyScore !== undefined) {
        const severity = anomalyScore > 0.3 ? 'CRITICAL' : anomalyScore > 0.15 ? 'WARNING' : 'INFO';
        anomalies.push({
          type: `VITAL_${reading.type}`,
          severity,
          message: `${reading.type} value ${reading.value} ${reading.unit} is outside normal range (${range.min}-${range.max} ${range.unit})`,
          data: { value: reading.value, unit: reading.unit, normalRange: range, anomalyScore },
        });

        alerts.push({
          alertType: 'VITAL_ANOMALY',
          severity: severity === 'CRITICAL' ? AuditSeverity.CRITICAL : severity === 'WARNING' ? AuditSeverity.WARNING : AuditSeverity.INFO,
          title: `${reading.type} Anomaly Detected`,
          message: `Patient ${patientId} has ${reading.type} of ${reading.value} ${reading.unit}, outside normal range.`,
          triggerData: { vitalType: reading.type, value: reading.value, unit: reading.unit, anomalyScore },
        });
      }
    }

    // Create stream events
    await prisma.liveDataStreamEvent.createMany({
      data: readings.map((r) => ({
        patientId,
        eventType: 'VITAL_UPDATE',
        source,
        payload: { type: r.type, value: r.value, unit: r.unit, deviceId: r.deviceId },
      })),
    });

    // Create clinical alerts for anomalies and broadcast live
    for (const alert of alerts) {
      await prisma.clinicalAlert.create({
        data: {
          patientId,
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          triggerData: alert.triggerData as Prisma.InputJsonValue,
        },
      });
      // Broadcast live alert to all subscribed clients
      this.broadcast(patientId, {
        type: 'CLINICAL_ALERT',
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        patientId,
        createdAt: new Date().toISOString(),
      });
    }

    // Broadcast vital updates live
    this.broadcast(patientId, {
      type: 'VITALS_UPDATE',
      patientId,
      readings: readings.map((r) => ({ type: r.type, value: r.value, unit: r.unit })),
      anomalies,
      createdAt: new Date().toISOString(),
    });

    return { created, anomalies, alerts };
  }

  /**
   * Ingest symptom entry and interpret for escalation
   */
  async ingestSymptom(patientId: string, entry: SymptomEntry, source = 'patient') {
    const created = await prisma.patientSymptomEntry.create({
      data: { patientId, symptom: entry.symptom, severity: entry.severity, source, notes: entry.notes },
    });

    const anomalies: InterpretationResult['anomalies'] = [];
    const alerts: InterpretationResult['alerts'] = [];

    // Check for severe/critical symptoms
    if (entry.severity === SymptomSeverity.CRITICAL || entry.severity === SymptomSeverity.SEVERE) {
      anomalies.push({
        type: 'SYMPTOM_ESCALATION',
        severity: entry.severity === SymptomSeverity.CRITICAL ? 'CRITICAL' : 'WARNING',
        message: `${entry.symptom} reported at ${entry.severity} severity`,
        data: { symptom: entry.symptom, severity: entry.severity, notes: entry.notes },
      });

      alerts.push({
        alertType: 'SYMPTOM_ESCALATION',
        severity: entry.severity === SymptomSeverity.CRITICAL ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
        title: `${entry.symptom} - ${entry.severity}`,
        message: `Patient ${patientId} reported ${entry.symptom} at ${entry.severity} severity.`,
        triggerData: { symptom: entry.symptom, severity: entry.severity, notes: entry.notes },
      });

      await prisma.patientSymptomEntry.update({
        where: { id: created.id },
        data: { triggeredAlert: true },
      });
    }

    // Get recent symptoms for trend analysis
    const recent = await prisma.patientSymptomEntry.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      take: 7,
    });

    // Detect worsening trend (3+ entries with increasing severity)
    const severityOrder: Record<SymptomSeverity, number> = {
      [SymptomSeverity.NONE]: 0,
      [SymptomSeverity.MILD]: 1,
      [SymptomSeverity.MODERATE]: 2,
      [SymptomSeverity.SEVERE]: 3,
      [SymptomSeverity.CRITICAL]: 4,
    };

    if (recent.length >= 3) {
      const severities = recent.map((r) => severityOrder[r.severity]);
      const isWorsening = severities.every((s, i) => i === 0 || s >= severities[i - 1]);
      if (isWorsening && severities[severities.length - 1] >= 3) {
        alerts.push({
          alertType: 'SYMPTOM_TREND_WORSENING',
          severity: AuditSeverity.WARNING,
          title: 'Symptom Trend Worsening',
          message: `Patient ${patientId} shows worsening symptom trend over ${recent.length} recent entries.`,
          triggerData: { symptom: entry.symptom, recentCount: recent.length, trendSeverities: severities },
        });
        await prisma.clinicalAlert.create({
          data: {
            patientId,
            alertType: 'SYMPTOM_TREND_WORSENING',
            severity: AuditSeverity.WARNING,
            title: 'Symptom Trend Worsening',
            message: `Patient ${patientId} shows worsening symptom trend.`,
            triggerData: { symptom: entry.symptom, recentCount: recent.length } as Prisma.InputJsonValue,
          },
        });
      }
    }

    await prisma.liveDataStreamEvent.create({
      data: {
        patientId,
        eventType: 'SYMPTOM_LOG',
        source,
        payload: { symptom: entry.symptom, severity: entry.severity, notes: entry.notes },
      },
    });

    // Broadcast live symptom and alerts
    this.broadcast(patientId, {
      type: 'SYMPTOM_LOG',
      patientId,
      symptom: entry.symptom,
      severity: entry.severity,
      createdAt: new Date().toISOString(),
    });

    for (const alert of alerts) {
      this.broadcast(patientId, {
        type: 'CLINICAL_ALERT',
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        patientId,
        createdAt: new Date().toISOString(),
      });
    }

    return { created, anomalies, alerts };
  }

  /**
   * Ingest medication adherence and interpret
   */
  async ingestMedicationAdherence(patientId: string, adherence: MedicationAdherence, source = 'patient_app') {
    const created = await prisma.medicationAdherenceLog.create({
      data: {
        patientId,
        medication: adherence.medication,
        dose: adherence.dose,
        status: adherence.status,
        takenAt: adherence.takenAt ? new Date(adherence.takenAt) : null,
        scheduledAt: adherence.scheduledAt ? new Date(adherence.scheduledAt) : null,
        notes: adherence.notes,
        sideEffects: adherence.sideEffects,
      },
    });

    const anomalies: InterpretationResult['anomalies'] = [];
    const alerts: InterpretationResult['alerts'] = [];

    if (adherence.status === AdherenceStatus.MISSED || adherence.status === AdherenceStatus.REFUSED) {
      anomalies.push({
        type: 'MEDICATION_MISSED',
        severity: adherence.status === AdherenceStatus.REFUSED ? 'CRITICAL' : 'WARNING',
        message: `${adherence.medication} ${adherence.status.toLowerCase()}`,
        data: { medication: adherence.medication, dose: adherence.dose, status: adherence.status },
      });

      alerts.push({
        alertType: 'MEDICATION_MISSED',
        severity: adherence.status === AdherenceStatus.REFUSED ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
        title: `${adherence.medication} - ${adherence.status}`,
        message: `Patient ${patientId} ${adherence.status.toLowerCase()} ${adherence.medication}.`,
        triggerData: { medication: adherence.medication, dose: adherence.dose, status: adherence.status },
      });

      await prisma.clinicalAlert.create({
        data: {
          patientId,
          alertType: 'MEDICATION_MISSED',
          severity: adherence.status === AdherenceStatus.REFUSED ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
          title: `${adherence.medication} - ${adherence.status}`,
          message: `Patient ${patientId} ${adherence.status.toLowerCase()} ${adherence.medication}.`,
          triggerData: { medication: adherence.medication, dose: adherence.dose, status: adherence.status } as Prisma.InputJsonValue,
        },
      });
    }

    // Check adherence pattern over last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAdherence = await prisma.medicationAdherenceLog.findMany({
      where: { patientId, medication: adherence.medication, createdAt: { gte: weekAgo } },
      orderBy: { createdAt: 'desc' },
    });

    if (recentAdherence.length >= 3) {
      const missedCount = recentAdherence.filter((a) => a.status === AdherenceStatus.MISSED || a.status === AdherenceStatus.REFUSED).length;
      const adherenceRate = ((recentAdherence.length - missedCount) / recentAdherence.length) * 100;

      if (adherenceRate < 70) {
        alerts.push({
          alertType: 'LOW_ADHERENCE',
          severity: AuditSeverity.WARNING,
          title: 'Low Medication Adherence',
          message: `Patient ${patientId} has ${adherenceRate.toFixed(0)}% adherence to ${adherence.medication} over 7 days.`,
          triggerData: { medication: adherence.medication, adherenceRate, totalDoses: recentAdherence.length, missedCount },
        });
        await prisma.clinicalAlert.create({
          data: {
            patientId,
            alertType: 'LOW_ADHERENCE',
            severity: AuditSeverity.WARNING,
            title: 'Low Medication Adherence',
            message: `Patient ${patientId} has ${adherenceRate.toFixed(0)}% adherence to ${adherence.medication}.`,
            triggerData: { medication: adherence.medication, adherenceRate, totalDoses: recentAdherence.length, missedCount } as Prisma.InputJsonValue,
          },
        });
      }
    }

    await prisma.liveDataStreamEvent.create({
      data: {
        patientId,
        eventType: 'MEDICATION_ADHERENCE',
        source,
        payload: { medication: adherence.medication, status: adherence.status, dose: adherence.dose },
      },
    });

    // Broadcast live adherence and alerts
    this.broadcast(patientId, {
      type: 'ADHERENCE_UPDATE',
      patientId,
      medication: adherence.medication,
      status: adherence.status,
      createdAt: new Date().toISOString(),
    });

    for (const alert of alerts) {
      this.broadcast(patientId, {
        type: 'CLINICAL_ALERT',
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        patientId,
        createdAt: new Date().toISOString(),
      });
    }

    return { created, anomalies, alerts };
  }

  /**
   * Ingest wearable data point
   */
  async ingestWearableData(deviceId: string, patientId: string, dataType: string, value: number, unit?: string, recordedAt?: string) {
    // Ensure device exists
    let device = await prisma.wearableDevice.findUnique({ where: { deviceId } });
    if (!device) {
      device = await prisma.wearableDevice.create({
        data: { patientId, deviceType: 'wearable', deviceId, isActive: true },
      });
    }

    const created = await prisma.wearableDataPoint.create({
      data: {
        deviceId,
        patientId,
        dataType,
        value,
        unit,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    await prisma.wearableDevice.update({
      where: { id: device.id },
      data: { lastSyncAt: new Date() },
    });

    await prisma.liveDataStreamEvent.create({
      data: {
        patientId,
        eventType: 'WEARABLE_SYNC',
        source: 'wearable',
        payload: { deviceId, dataType, value, unit, recordedAt },
      },
    });

    // Broadcast live wearable data
    this.broadcast(patientId, {
      type: 'WEARABLE_DATA',
      patientId,
      deviceId,
      dataType,
      value,
      unit,
      createdAt: new Date().toISOString(),
    });

    return created;
  }

  /**
   * Get live dashboard data for a patient
   */
  async getPatientLiveDashboard(patientId: string) {
    const [vitals, symptoms, adherence, alerts, devices] = await Promise.all([
      prisma.patientVitalSigns.findMany({
        where: { patientId },
        orderBy: { recordedAt: 'desc' },
        take: 50,
      }),
      prisma.patientSymptomEntry.findMany({
        where: { patientId },
        orderBy: { recordedAt: 'desc' },
        take: 20,
      }),
      prisma.medicationAdherenceLog.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.clinicalAlert.findMany({
        where: { patientId, acknowledged: false },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        take: 20,
      }),
      prisma.wearableDevice.findMany({ where: { patientId, isActive: true } }),
    ]);

    return { vitals, symptoms, adherence, alerts, devices };
  }

  /**
   * Get all unacknowledged clinical alerts (for clinician dashboard)
   */
  async getAllActiveAlerts() {
    return prisma.clinicalAlert.findMany({
      where: { acknowledged: false },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      take: 100,
    });
  }

  /**
   * Acknowledge a clinical alert
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await prisma.clinicalAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error('Alert not found');
    return prisma.clinicalAlert.update({
      where: { id: alertId },
      data: { acknowledged: true, acknowledgedAt: new Date(), acknowledgedById: userId },
    });
  }

  /**
   * Get live stream events (unprocessed)
   */
  async getUnprocessedEvents(limit = 100) {
    return prisma.liveDataStreamEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark events as processed
   */
  async markEventsProcessed(eventIds: string[]) {
    return prisma.liveDataStreamEvent.updateMany({
      where: { id: { in: eventIds } },
      data: { processed: true, processedAt: new Date() },
    });
  }
}
