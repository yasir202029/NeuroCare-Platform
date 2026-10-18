import { Prisma, GpCommunicationStatus, GpRecordUpdateStatus, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, notFound, forbidden } from '../../shared/errors.js';
import { logger } from '../../infrastructure/logger.js';
import { ServiceCoordinationService } from '../coordination/coordination.service.js';

const coordinationService = new ServiceCoordinationService();

export class GpCommunicationService {
  /**
   * Send assessment and medication to GP (shared care communication)
   */
  async sendToGp(input: {
    patientId: string;
    clinicianId: string;
    assessmentId?: string;
    prescriptionId?: string;
    gpName: string;
    gpPractice: string;
    gpEmail?: string;
    gpNhsNumber?: string;
    communicationType: string;
    subject: string;
    content: string;
    sharedCareAgreementId?: string;
  }) {
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true, nhsNumberHash: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (!patient) throw badRequest('Patient not found');

    // Check if there's an existing shared care agreement
    let sharedCareAgreementId = input.sharedCareAgreementId;
    if (!sharedCareAgreementId) {
      const existing = await prisma.sharedCareAgreement.findFirst({
        where: { patientId: input.patientId, status: 'ACTIVE' },
      });
      if (existing) sharedCareAgreementId = existing.id;
    }

    const communication = await prisma.gpCommunication.create({
      data: {
        patientId: input.patientId,
        clinicianId: input.clinicianId,
        assessmentId: input.assessmentId,
        prescriptionId: input.prescriptionId,
        gpName: input.gpName,
        gpPractice: input.gpPractice,
        gpEmail: input.gpEmail,
        gpNhsNumber: input.gpNhsNumber,
        communicationType: input.communicationType,
        status: GpCommunicationStatus.SENT,
        subject: input.subject,
        content: input.content,
        sharedCareAgreementId,
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
        assessment: { select: { id: true, type: true, status: true } },
        prescription: { select: { id: true, status: true } },
      },
    });

    // Emit cross-module event
    await coordinationService.emitCrossModuleEvent({
      eventType: 'GP_COMMUNICATION_SENT',
      sourceModule: 'gp-communication',
      patientId: input.patientId,
      actorId: input.clinicianId,
      payload: {
        communicationId: communication.id,
        gpName: input.gpName,
        gpPractice: input.gpPractice,
        communicationType: input.communicationType,
        status: communication.status,
      },
      priority: input.communicationType === 'URGENT' ? 'HIGH' : 'MEDIUM',
    });

    logger.info(
      { patientId: input.patientId, gpName: input.gpName, communicationType: input.communicationType },
      'GP communication sent',
    );

    return communication;
  }

  /**
   * Get all GP communications for a patient
   */
  async getPatientCommunications(patientId: string) {
    return prisma.gpCommunication.findMany({
      where: { patientId },
      include: {
        clinician: { select: { id: true, firstName: true, lastName: true } },
        assessment: { select: { id: true, type: true, status: true } },
        prescription: { select: { id: true, status: true } },
        sharedCareAgreement: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all GP communications (for clinicians/admins)
   */
  async getAllCommunications(filter?: {
    patientId?: string;
    status?: GpCommunicationStatus;
    gpNhsNumber?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (filter?.patientId) where.patientId = filter.patientId;
    if (filter?.status) where.status = filter.status;
    if (filter?.gpNhsNumber) where.gpNhsNumber = filter.gpNhsNumber;

    return prisma.gpCommunication.findMany({
      where,
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Acknowledge a GP communication (GP acknowledges receipt)
   */
  async acknowledgeCommunication(
    communicationId: string,
    acknowledgedBy: string,
  ) {
    const communication = await prisma.gpCommunication.findUnique({
      where: { id: communicationId },
    });
    if (!communication) throw notFound('GP communication not found');

    const updated = await prisma.gpCommunication.update({
      where: { id: communicationId },
      data: {
        status: GpCommunicationStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    await coordinationService.emitCrossModuleEvent({
      eventType: 'GP_COMMUNICATION_ACKNOWLEDGED',
      sourceModule: 'gp-communication',
      patientId: communication.patientId,
      actorId: acknowledgedBy,
      payload: {
        communicationId,
        status: GpCommunicationStatus.ACKNOWLEDGED,
      },
      priority: 'MEDIUM',
    });

    return updated;
  }

  /**
   * GP submits a record update back to the clinic
   */
  async submitRecordUpdate(input: {
    patientId: string;
    gpCommunicationId?: string;
    gpName: string;
    gpPractice: string;
    gpNhsNumber?: string;
    updateType: string;
    title: string;
    description: string;
    clinicalData: Record<string, unknown>;
    currentValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    requiresClinicianApproval?: boolean;
  }) {
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
    });
    if (!patient) throw badRequest('Patient not found');

    const update = await prisma.gpRecordUpdate.create({
      data: {
        patientId: input.patientId,
        gpCommunicationId: input.gpCommunicationId,
        gpName: input.gpName,
        gpPractice: input.gpPractice,
        gpNhsNumber: input.gpNhsNumber,
        updateType: input.updateType as any,
        status: GpRecordUpdateStatus.PENDING,
        title: input.title,
        description: input.description,
        clinicalData: input.clinicalData as Prisma.InputJsonValue,
        currentValue: input.currentValue as Prisma.InputJsonValue | undefined,
        newValue: input.newValue as Prisma.InputJsonValue | undefined,
        requiresClinicianApproval: input.requiresClinicianApproval ?? true,
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Emit cross-module event for record update
    await coordinationService.emitCrossModuleEvent({
      eventType: 'GP_RECORD_UPDATED',
      sourceModule: 'gp-communication',
      patientId: input.patientId,
      payload: {
        updateId: update.id,
        updateType: input.updateType,
        status: update.status,
        requiresClinicianApproval: update.requiresClinicianApproval,
      },
      priority: input.requiresClinicianApproval ? 'HIGH' : 'MEDIUM',
    });

    logger.info(
      { patientId: input.patientId, updateType: input.updateType, gpName: input.gpName },
      'GP record update submitted',
    );

    return update;
  }

  /**
   * Get all GP record updates (for clinicians to review/apply)
   */
  async getPendingRecordUpdates(filter?: {
    patientId?: string;
    status?: GpRecordUpdateStatus;
    requiresClinicianApproval?: boolean;
  }) {
    const where: Record<string, unknown> = {};
    if (filter?.patientId) where.patientId = filter.patientId;
    if (filter?.status) where.status = filter.status;
    if (filter?.requiresClinicianApproval !== undefined)
      where.requiresClinicianApproval = filter.requiresClinicianApproval;

    return prisma.gpRecordUpdate.findMany({
      where,
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        appliedBy: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Clinician applies a GP record update to the patient record
   */
  async applyRecordUpdate(
    updateId: string,
    appliedById: string,
    approvalNotes?: string,
  ) {
    const update = await prisma.gpRecordUpdate.findUnique({
      where: { id: updateId },
    });
    if (!update) throw badRequest('GP record update not found');
    if (update.status !== GpRecordUpdateStatus.PENDING)
      throw badRequest('Record update is not in pending status');

    const updated = await prisma.gpRecordUpdate.update({
      where: { id: updateId },
      data: {
        status: GpRecordUpdateStatus.APPLIED,
        appliedById,
        appliedAt: new Date(),
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    await coordinationService.emitCrossModuleEvent({
      eventType: 'GP_RECORD_APPLIED',
      sourceModule: 'gp-communication',
      patientId: update.patientId,
      actorId: appliedById,
      payload: {
        updateId,
        updateType: update.updateType,
        status: GpRecordUpdateStatus.APPLIED,
        approvalNotes,
      },
      priority: 'MEDIUM',
    });

    return updated;
  }

  /**
   * Reject a GP record update
   */
  async rejectRecordUpdate(
    updateId: string,
    reviewedById: string,
    rejectionReason: string,
  ) {
    const update = await prisma.gpRecordUpdate.findUnique({
      where: { id: updateId },
    });
    if (!update) throw badRequest('GP record update not found');

    const updated = await prisma.gpRecordUpdate.update({
      where: { id: updateId },
      data: {
        status: GpRecordUpdateStatus.REJECTED,
        reviewedById,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    return updated;
  }

  /**
   * Get shared care summary for a patient
   */
  async getSharedCareSummary(patientId: string) {
    const [communications, recordUpdates, sharedCare] = await Promise.all([
      prisma.gpCommunication.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.gpRecordUpdate.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.sharedCareAgreement.findFirst({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      patientId,
      sharedCareAgreement: sharedCare,
      recentCommunications: communications,
      recentRecordUpdates: recordUpdates,
      totalCommunications: communications.length,
      pendingUpdates: recordUpdates.filter((u) => u.status === 'PENDING').length,
      lastCommunication: communications[0] ?? null,
    };
  }
}
