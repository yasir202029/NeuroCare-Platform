import { Role, type Prisma } from "@prisma/client";
import { prisma } from "../shared/db.js";
import { forbidden, notFound } from "../shared/errors.js";
import { assertPatientAccess } from "./patient-authz.service.js";

/**
 * Roles that may work with clinical monitoring data. Mirrors
 * `clinicalStaffRoles` in the auth middleware, but lives here so the service
 * layer does not depend on the HTTP layer.
 */
const CLINICAL_ROLES: Role[] = [
  Role.ADMIN,
  Role.PSYCHIATRIST,
  Role.PRESCRIBER,
  Role.NURSE,
];

const isClinical = (roles: Role[]) => roles.some((role) => CLINICAL_ROLES.includes(role));

/**
 * Deterministic validation rules for remote physical health monitoring.
 *
 * These are independent of any AI model — purely physiological thresholds.
 * Out-of-range values create review flags; missing information stays missing.
 */
export const MONITORING_RULES = {
  bloodPressureSystolic: { min: 60, max: 240, criticalMin: 90, criticalMax: 180 },
  bloodPressureDiastolic: { min: 30, max: 130, criticalMin: 40, criticalMax: 110 },
  pulse: { min: 30, max: 200, criticalMin: 40, criticalMax: 150 },
  weightKg: { min: 30, max: 300, criticalMin: 35, criticalMax: 250 },
  heightCm: { min: 50, max: 250, criticalMin: 80, criticalMax: 220 },
  bmi: { min: 10, max: 70, criticalMin: 12, criticalMax: 50 },
  sleepHours: { min: 0, max: 24, criticalMin: 1, criticalMax: 16 },
} as const;

type RuleMetric = keyof typeof MONITORING_RULES;

export type MonitoringReadings = {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  sleepHours?: number;
  appetite?: string;
  sideEffects?: string;
  notes?: string;
  clinicianId?: string;
};

export type MonitoringAlert = {
  metric: string;
  severity: "WARNING" | "CRITICAL";
  message: string;
};

/**
 * Deterministic rule evaluation — pure function, no IO.
 * WARNING = outside plausible range. CRITICAL = outside safe range.
 */
export function evaluateMonitoringReadings(
  readings: MonitoringReadings,
): MonitoringAlert[] {
  const alerts: MonitoringAlert[] = [];
  for (const [field, rule] of Object.entries(MONITORING_RULES) as [
    RuleMetric,
    { min: number; max: number; criticalMin: number; criticalMax: number },
  ][]) {
    const value = readings[field];
    if (value === undefined || value === null) continue;
    if (value < rule.min || value > rule.max) {
      alerts.push({
        metric: field,
        severity: "WARNING",
        message: `${field} value ${value} is outside the expected range (${rule.min}–${rule.max})`,
      });
    } else if (value < rule.criticalMin || value > rule.criticalMax) {
      alerts.push({
        metric: field,
        severity: "CRITICAL",
        message: `${field} value ${value} is outside the safe range (${rule.criticalMin}–${rule.criticalMax}) and requires clinical review`,
      });
    }
  }
  return alerts;
}

/**
 * Validate readings and persist a physical health review with nested alerts.
 *
 * Alerts are created in the SAME transaction as the review they belong to,
 * referencing the newly created review — never a stale previous one.
 */
export async function submitMonitoringReadings(
  patientId: string,
  clinicianId: string | undefined,
  readings: MonitoringReadings,
) {
  const alerts = evaluateMonitoringReadings(readings);
  const alertRows = alerts.map((a) => ({
    metric: a.metric,
    severity: a.severity,
    message: a.message,
  }));

  // PhysicalHealthReview.clinicianId references the Clinician model, not User.
  // Resolve the actor's Clinician record; patients and non-clinical users store null.
  const clinician = clinicianId
    ? await prisma.clinician.findUnique({ where: { userId: clinicianId }, select: { id: true } })
    : null;

  const result = await prisma.physicalHealthReview.create({
    data: {
      patientId,
      clinicianId: clinician?.id,
      bloodPressureSystolic: readings.bloodPressureSystolic,
      bloodPressureDiastolic: readings.bloodPressureDiastolic,
      pulse: readings.pulse,
      weightKg: readings.weightKg,
      heightCm: readings.heightCm,
      bmi: readings.bmi,
      sleepHours: readings.sleepHours,
      appetite: readings.appetite,
      sideEffects: readings.sideEffects,
      notes: readings.notes,
      alerts: alertRows.length > 0 ? { create: alertRows } : undefined,
    },
    include: { alerts: { select: { metric: true, severity: true } } },
  });

  return {
    review: result,
    alertCount: alertRows.length,
    alerts: alertRows,
  };
}

/**
 * Get monitoring history for a patient.
 * Enforces cross-patient isolation: PATIENT sees only their own record,
 * clinicians see records for patients they are assigned to, ADMIN sees all.
 */
export async function getPatientMonitoringHistory(
  patientId: string,
  userId: string,
  roles: Role[],
) {
  // Shared isolation rules: ownership for patients, active assignment for
  // clinical staff, organisation scoping, and an ADMIN bypass.
  await assertPatientAccess(userId, roles, patientId);

  const [reviews, totalCount] = await Promise.all([
    prisma.physicalHealthReview.findMany({
      where: { patientId },
      orderBy: { reviewDate: "desc" },
      take: 50,
      include: {
        alerts: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            metric: true,
            severity: true,
            message: true,
            acknowledgedAt: true,
          },
        },
      },
    }),
    prisma.physicalHealthReview.count({ where: { patientId } }),
  ]);

  return {
    patientId,
    reviews: reviews.map((r) => ({
      id: r.id,
      reviewDate: r.reviewDate,
      bloodPressureSystolic: r.bloodPressureSystolic,
      bloodPressureDiastolic: r.bloodPressureDiastolic,
      pulse: r.pulse,
      weightKg: r.weightKg?.toNumber() ?? null,
      heightCm: r.heightCm?.toNumber() ?? null,
      bmi: r.bmi?.toNumber() ?? null,
      sleepHours: r.sleepHours?.toNumber() ?? null,
      appetite: r.appetite,
      sideEffects: r.sideEffects,
      notes: r.notes,
      alertCount: r.alerts.length,
      alerts: r.alerts.map((a) => ({
        id: a.id,
        metric: a.metric,
        severity: a.severity,
        message: a.message,
        acknowledgedAt: a.acknowledgedAt,
      })),
    })),
    totalCount,
  };
}

export type MonitoringSaveInput = Parameters<
  typeof prisma.physicalHealthReview.create
>[0]["data"];
export type MonitoringPrismaInput = Prisma.PhysicalHealthReviewCreateInput;

// ── Clinician alert review ────────────────────────────────────────────────

export type OpenMonitoringAlert = {
  id: string;
  metric: string;
  severity: string;
  message: string;
  createdAt: Date;
  reviewId: string;
  reviewDate: Date;
  patientId: string;
  patientFirstName: string | null;
  patientLastName: string | null;
};

export type OpenMonitoringAlertQueue = {
  alerts: OpenMonitoringAlert[];
  /** Total unacknowledged alerts in scope, even when the page is capped. */
  totalCount: number;
  /** Maximum alerts returned in one page. */
  limit: number;
};

const OPEN_ALERT_PAGE_SIZE = 50;

/**
 * Unacknowledged physical-health alerts across patients the caller may access.
 *
 * ADMIN sees all open alerts; clinical staff see only alerts for patients
 * they are actively assigned to, within the organisation(s) they belong to.
 * Patients have no access to this queue.
 */
export async function listOpenMonitoringAlerts(
  userId: string,
  roles: Role[],
): Promise<OpenMonitoringAlertQueue> {
  const isAdmin = roles.includes(Role.ADMIN);
  if (!isAdmin && !isClinical(roles)) {
    return { alerts: [], totalCount: 0, limit: OPEN_ALERT_PAGE_SIZE };
  }

  let patientIds: string[] = [];
  if (!isAdmin) {
    const assigned = await prisma.patientAssignment.findMany({
      where: { userId, active: true },
      select: { patientId: true },
    });
    if (assigned.length === 0) {
      return { alerts: [], totalCount: 0, limit: OPEN_ALERT_PAGE_SIZE };
    }

    // Tenant isolation: the clinician may only see alerts for patients that
    // either have no organisation or belong to one of the clinician's own
    // organisations — the same rule applied by assertPatientAccess.
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      select: { orgId: true },
    });
    const orgIds = memberships.map((m) => m.orgId);
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: assigned.map((a) => a.patientId) },
        OR: [{ organizationId: null }, { organizationId: { in: orgIds } }],
      },
      select: { id: true },
    });
    patientIds = patients.map((p) => p.id);
    if (patientIds.length === 0) {
      return { alerts: [], totalCount: 0, limit: OPEN_ALERT_PAGE_SIZE };
    }
  }

  const where = {
    acknowledgedAt: null,
    ...(isAdmin ? {} : { review: { patientId: { in: patientIds } } }),
  };

  const [alerts, totalCount] = await Promise.all([
    prisma.physicalHealthAlert.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: OPEN_ALERT_PAGE_SIZE,
      include: {
        review: {
          select: {
            patientId: true,
            reviewDate: true,
            patient: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.physicalHealthAlert.count({ where }),
  ]);

  return {
    alerts: alerts.map((a) => ({
      id: a.id,
      metric: a.metric,
      severity: a.severity,
      message: a.message,
      createdAt: a.createdAt,
      reviewId: a.reviewId,
      reviewDate: a.review.reviewDate,
      patientId: a.review.patientId,
      patientFirstName: a.review.patient.user.firstName,
      patientLastName: a.review.patient.user.lastName,
    })),
    totalCount,
    limit: OPEN_ALERT_PAGE_SIZE,
  };
}

/**
 * Acknowledge a physical-health alert.
 *
 * Authorization: PATIENT can never acknowledge clinical alerts; clinical
 * staff must be actively assigned to the alert's patient and share its
 * organisation; ADMIN may acknowledge any. Idempotent — acknowledging an
 * already-acknowledged alert returns the original timestamp without a second
 * write, and concurrent acknowledgements keep the first timestamp.
 */
export async function acknowledgeMonitoringAlert(
  alertId: string,
  userId: string,
  roles: Role[],
) {
  const alert = await prisma.physicalHealthAlert.findUnique({
    where: { id: alertId },
    include: { review: { select: { patientId: true, reviewDate: true } } },
  });
  if (!alert) throw notFound("Monitoring alert not found");

  if (!isClinical(roles)) {
    throw forbidden("You cannot acknowledge clinical monitoring alerts");
  }
  // Shared isolation rules: active assignment for clinical staff, organisation
  // scoping, and an ADMIN bypass.
  await assertPatientAccess(userId, roles, alert.review.patientId);

  if (alert.acknowledgedAt) {
    return {
      id: alert.id,
      patientId: alert.review.patientId,
      acknowledgedAt: alert.acknowledgedAt,
      alreadyAcknowledged: true,
    };
  }

  const acknowledgedAt = new Date();
  // Conditional write: only the first acknowledgement wins, so a double click
  // cannot overwrite the recorded review time.
  const { count } = await prisma.physicalHealthAlert.updateMany({
    where: { id: alert.id, acknowledgedAt: null },
    data: { acknowledgedAt },
  });

  if (count === 0) {
    const current = await prisma.physicalHealthAlert.findUnique({
      where: { id: alert.id },
      select: { acknowledgedAt: true },
    });
    return {
      id: alert.id,
      patientId: alert.review.patientId,
      acknowledgedAt: current?.acknowledgedAt ?? acknowledgedAt,
      alreadyAcknowledged: true,
    };
  }

  return {
    id: alert.id,
    patientId: alert.review.patientId,
    acknowledgedAt,
    alreadyAcknowledged: false,
  };
}
