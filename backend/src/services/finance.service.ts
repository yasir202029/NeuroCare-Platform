import { AppointmentStatus, AssessmentType, InvoiceStatus, PaymentStatus, RevenueEventType, Role, ServiceLine } from '@prisma/client';
import { prisma } from '../shared/db.js';
import { notFound } from '../shared/errors.js';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date: Date) => { const value = startOfDay(date); const day = value.getDay(); value.setDate(value.getDate() - (day === 0 ? 6 : day - 1)); return value; };
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

export class FinanceService {
  async dashboard(now = new Date()) {
    const periods = { today: startOfDay(now), week: startOfWeek(now), month: startOfMonth(now), year: startOfYear(now) };
    const revenue = await Promise.all(Object.entries(periods).map(async ([key, from]) => [key, await this.revenue(from, now)] as const));
    const [newPatients, activePatients, waitingList, adhdAssessments, autismAssessments, followUps, medicationReviews, outstanding] = await Promise.all([
      prisma.patient.count({ where: { createdAt: { gte: periods.month } } }),
      prisma.patient.count({ where: { assessments: { some: { status: { in: ['INTAKE', 'SCREENING', 'CLINICAL_REVIEW', 'REPORTING'] } } } } }),
      prisma.assessment.count({ where: { status: 'INTAKE' } }),
      prisma.assessment.count({ where: { type: AssessmentType.ADHD, createdAt: { gte: periods.month } } }),
      prisma.assessment.count({ where: { type: AssessmentType.AUTISM, createdAt: { gte: periods.month } } }),
      prisma.revenueEvent.count({ where: { serviceLine: ServiceLine.FOLLOW_UP, occurredAt: { gte: periods.month } } }),
      prisma.revenueEvent.count({ where: { serviceLine: ServiceLine.MEDICATION_REVIEW, occurredAt: { gte: periods.month } } }),
      prisma.invoice.aggregate({ where: { status: { in: [InvoiceStatus.OPEN, InvoiceStatus.OVERDUE] } }, _sum: { totalPence: true } }),
    ]);
    return { revenue: Object.fromEntries(revenue), patients: { new: newPatients, active: activePatients, waitingList }, activity: { adhdAssessments, autismAssessments, followUps, medicationReviews }, outstandingBalancePence: outstanding._sum.totalPence ?? 0 };
  }

  async revenueByClinician(from: Date, to: Date) { return prisma.revenueEvent.groupBy({ by: ['clinicianId'], where: { occurredAt: { gte: from, lt: to }, type: RevenueEventType.PAYMENT_RECEIVED }, _sum: { amountPence: true }, _count: { id: true }, orderBy: { _sum: { amountPence: 'desc' } } }); }
  async revenueByService(from: Date, to: Date) { return prisma.revenueEvent.groupBy({ by: ['serviceLine'], where: { occurredAt: { gte: from, lt: to }, type: RevenueEventType.PAYMENT_RECEIVED }, _sum: { amountPence: true }, _count: { id: true }, orderBy: { _sum: { amountPence: 'desc' } } }); }
  async analytics(from: Date, to: Date) { const [assessments, completed, followUps, sharedCare, discharges] = await Promise.all([prisma.assessment.count({ where: { createdAt: { gte: from, lt: to } } }), prisma.assessment.count({ where: { status: 'COMPLETE', completedAt: { gte: from, lt: to } } }), prisma.revenueEvent.count({ where: { serviceLine: ServiceLine.FOLLOW_UP, occurredAt: { gte: from, lt: to } } }), prisma.sharedCareAgreement.count({ where: { startDate: { gte: from, lt: to } } }), prisma.assessment.count({ where: { status: 'WITHDRAWN', updatedAt: { gte: from, lt: to } } })]); return { conversionRate: assessments ? completed / assessments : 0, followUpRate: assessments ? followUps / assessments : 0, sharedCareRate: assessments ? sharedCare / assessments : 0, dischargeRate: assessments ? discharges / assessments : 0, assessments, completed, followUps, sharedCare, discharges }; }
  async clinicianEarnings(userId: string) { const clinician = await prisma.clinician.findUnique({ where: { userId }, include: { earnings: { orderBy: { periodStart: 'desc' }, take: 100 } } }); if (!clinician) throw notFound('Clinician profile not found'); return { clinicianId: clinician.id, earnings: clinician.earnings }; }
  async recordKpis() { const now = new Date(); const dashboard = await this.dashboard(now); const metrics = [['revenue_month', dashboard.revenue.month.amountPence], ['new_patients_month', dashboard.patients.new], ['active_patients', dashboard.patients.active], ['waiting_list', dashboard.patients.waitingList]] as const; for (const [metricKey, value] of metrics) { await prisma.kpiSnapshot.upsert({ where: { metricKey_granularity_periodStart_periodEnd: { metricKey, granularity: 'MONTHLY', periodStart: startOfMonth(now), periodEnd: now } }, create: { metricKey, granularity: 'MONTHLY', periodStart: startOfMonth(now), periodEnd: now, value }, update: { value } }); } return dashboard; }
  private async revenue(from: Date, to: Date) { const result = await prisma.revenueEvent.aggregate({ where: { type: RevenueEventType.PAYMENT_RECEIVED, occurredAt: { gte: from, lt: to } }, _sum: { amountPence: true }, _count: { id: true } }); return { amountPence: result._sum.amountPence ?? 0, transactions: result._count.id }; }
}
