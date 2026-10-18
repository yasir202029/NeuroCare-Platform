import { Prisma, ReportStatus, ReportSignatureMethod, ReportSignatureStatus, ReportSharePurpose, ReportShareStatus, NextStepType, NextStepStatus, Role, AuditSeverity } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, notFound, forbidden } from '../../shared/errors.js';
import crypto from 'node:crypto';

type CreateReportSignatureInput = {
  reportId: string;
  signerId: string;
  method?: ReportSignatureMethod;
  ipAddress?: string;
  userAgent?: string;
  mfaVerified?: boolean;
};

type ShareReportInput = {
  reportId: string;
  sharedById: string;
  patientId: string;
  purpose: ReportSharePurpose;
  sharedWithId?: string;
  accessExpiresAt?: string;
  message?: string;
};

type CreateNextStepInput = {
  reportId: string;
  patientId: string;
  type: NextStepType;
  title: string;
  description?: string;
  scheduledAt?: string;
  clinicianId?: string;
  createdById: string;
};

export class ReportSignatureService {
  /**
   * Sign a report digitally
   */
  async signReport(input: CreateReportSignatureInput) {
    const report = await prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw notFound('Report not found');
    if (report.status === ReportStatus.APPROVED) throw badRequest('Report already approved');
    if (report.status === ReportStatus.SHARED) throw badRequest('Report already shared');

    // Check if signer already signed this report
    const existing = await prisma.reportSignature.findUnique({
      where: { reportId_signerId: { reportId: input.reportId, signerId: input.signerId } },
    });
    if (existing && existing.status === ReportSignatureStatus.SIGNED) {
      throw badRequest('Report already signed by this user');
    }

    const signatureHash = crypto.createHash('sha256')
      .update(`${input.reportId}:${input.signerId}:${new Date().toISOString()}`)
      .digest('hex');

    const signature = await prisma.reportSignature.create({
      data: {
        reportId: input.reportId,
        signerId: input.signerId,
        method: input.method ?? ReportSignatureMethod.DIGITAL,
        status: ReportSignatureStatus.SIGNED,
        signatureHash,
        signedAt: new Date(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        mfaVerified: input.mfaVerified ?? false,
      },
      include: {
        signer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Check if all required clinicians have signed, then approve report
    const allSignatures = await prisma.reportSignature.findMany({
      where: { reportId: input.reportId },
    });

    const allSigned = allSignatures.length > 0 && allSignatures.every((s) => s.status === ReportSignatureStatus.SIGNED);

    if (allSigned) {
      await prisma.report.update({
        where: { id: input.reportId },
        data: { status: ReportStatus.APPROVED },
      });

      await prisma.reportAuditEvent.create({
        data: {
          reportId: input.reportId,
          actorId: input.signerId,
          action: 'REPORT_APPROVED',
          metadata: { reason: 'All required signatures collected' },
        },
      });
    }

    await prisma.reportAuditEvent.create({
      data: {
        reportId: input.reportId,
        actorId: input.signerId,
        action: 'REPORT_SIGNED',
        metadata: { method: input.method, signatureHash },
      },
    });

    return { signature, reportStatus: allSigned ? ReportStatus.APPROVED : ReportStatus.REVIEW_REQUIRED };
  }

  /**
   * Revoke a signature
   */
  async revokeSignature(signatureId: string, revokedById: string) {
    const signature = await prisma.reportSignature.findUnique({ where: { id: signatureId } });
    if (!signature) throw notFound('Signature not found');
    if (signature.status !== ReportSignatureStatus.SIGNED) throw badRequest('Signature not active');

    const updated = await prisma.reportSignature.update({
      where: { id: signatureId },
      data: {
        status: ReportSignatureStatus.REVOKED,
        revokedAt: new Date(),
        revokedById,
      },
      include: { signer: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Revert report to review required if it was approved
    await prisma.report.update({
      where: { id: signature.reportId },
      data: { status: ReportStatus.REVIEW_REQUIRED },
    });

    await prisma.reportAuditEvent.create({
      data: {
        reportId: signature.reportId,
        actorId: revokedById,
        action: 'REPORT_SIGNATURE_REVOKED',
        metadata: { signatureId, signerId: signature.signerId },
      },
    });

    return updated;
  }

  /**
   * Get all signatures for a report
   */
  async getSignatures(reportId: string) {
    return prisma.reportSignature.findMany({
      where: { reportId },
      include: {
        signer: { select: { id: true, firstName: true, lastName: true, email: true } },
        revokedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { signedAt: 'desc' },
    });
  }

  /**
   * Share a report with a recipient
   */
  async shareReport(input: ShareReportInput) {
    const report = await prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw notFound('Report not found');
    if (report.status !== ReportStatus.APPROVED) throw badRequest('Report must be approved before sharing');

    const accessToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = input.accessExpiresAt ? new Date(input.accessExpiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const share = await prisma.reportShare.create({
      data: {
        reportId: input.reportId,
        patientId: input.patientId,
        sharedById: input.sharedById,
        sharedWithId: input.sharedWithId,
        purpose: input.purpose,
        status: ReportShareStatus.SENT,
        accessToken,
        accessExpiresAt: expiresAt,
        message: input.message,
      },
      include: {
        sharedBy: { select: { id: true, firstName: true, lastName: true } },
        sharedWith: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Update report status to shared
    await prisma.report.update({
      where: { id: input.reportId },
      data: { status: ReportStatus.SHARED },
    });

    await prisma.reportAuditEvent.create({
      data: {
        reportId: input.reportId,
        actorId: input.sharedById,
        action: 'REPORT_SHARED',
        metadata: { purpose: input.purpose, shareId: share.id, recipient: input.sharedWithId },
      },
    });

    // Record access
    await prisma.reportAccess.create({
      data: {
        reportId: input.reportId,
        accessedById: input.sharedById,
        patientId: input.patientId,
        action: 'SHARE',
        ipAddress: undefined,
        userAgent: undefined,
      },
    });

    return { share, accessToken, expiresAt };
  }

  /**
   * Get all shares for a report
   */
  async getShares(reportId: string) {
    return prisma.reportShare.findMany({
      where: { reportId },
      include: {
        sharedBy: { select: { id: true, firstName: true, lastName: true } },
        sharedWith: { select: { id: true, firstName: true, lastName: true, email: true } },
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke a share
   */
  async revokeShare(shareId: string, revokedById: string) {
    const share = await prisma.reportShare.findUnique({ where: { id: shareId } });
    if (!share) throw notFound('Share not found');

    const updated = await prisma.reportShare.update({
      where: { id: shareId },
      data: { status: ReportShareStatus.REVOKED },
      include: { patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } } },
    });

    await prisma.reportAuditEvent.create({
      data: {
        reportId: share.reportId,
        actorId: revokedById,
        action: 'REPORT_SHARE_REVOKED',
        metadata: { shareId, purpose: share.purpose },
      },
    });

    return updated;
  }

  /**
   * Access a report via share token (for patients/external recipients)
   */
  async accessReportByToken(accessToken: string, accessedById: string, action: string, ipAddress?: string, userAgent?: string) {
    const share = await prisma.reportShare.findUnique({ where: { accessToken } });
    if (!share) throw notFound('Invalid share link');
    if (share.status !== ReportShareStatus.SENT) throw badRequest('Share link not active');
    if (share.accessExpiresAt && new Date() > share.accessExpiresAt) {
      await prisma.reportShare.update({ where: { id: share.id }, data: { status: ReportShareStatus.EXPIRED } });
      throw badRequest('Share link expired');
    }

    const report = await prisma.report.findUnique({ where: { id: share.reportId } });
    if (!report) throw notFound('Report not found');

    // Record access
    await prisma.reportAccess.create({
      data: {
        reportId: share.reportId,
        accessedById,
        patientId: share.patientId,
        action,
        ipAddress,
        userAgent,
      },
    });

    // Update share stats
    await prisma.reportShare.update({
      where: { id: share.id },
      data: {
        accessedAt: new Date(),
        accessCount: { increment: 1 },
      },
    });

    return { share, report };
  }

  /**
   * Create a next step for a report
   */
  async createNextStep(input: CreateNextStepInput) {
    const report = await prisma.report.findUnique({ where: { id: input.reportId } });
    if (!report) throw notFound('Report not found');

    const nextStep = await prisma.reportNextStep.create({
      data: {
        reportId: input.reportId,
        patientId: input.patientId,
        type: input.type,
        title: input.title,
        description: input.description,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        clinicianId: input.clinicianId,
        createdById: input.createdById,
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.reportAuditEvent.create({
      data: {
        reportId: input.reportId,
        actorId: input.createdById,
        action: 'REPORT_NEXT_STEP_CREATED',
        metadata: { type: input.type, nextStepId: nextStep.id },
      },
    });

    return nextStep;
  }

  /**
   * Get all next steps for a report
   */
  async getNextSteps(reportId: string) {
    return prisma.reportNextStep.findMany({
      where: { reportId },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Update next step status
   */
  async updateNextStepStatus(nextStepId: string, status: NextStepStatus, completedById?: string) {
    const nextStep = await prisma.reportNextStep.findUnique({ where: { id: nextStepId } });
    if (!nextStep) throw notFound('Next step not found');

    const updated = await prisma.reportNextStep.update({
      where: { id: nextStepId },
      data: {
        status,
        ...(status === NextStepStatus.COMPLETED && { completedAt: new Date() }),
      },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.reportAuditEvent.create({
      data: {
        reportId: nextStep.reportId,
        actorId: completedById ?? updated.createdById,
        action: 'REPORT_NEXT_STEP_UPDATED',
        metadata: { nextStepId, status, previousStatus: nextStep.status },
      },
    });

    return updated;
  }

  /**
   * Get report full lifecycle (signatures, shares, next steps, access log)
   */
  async getReportLifecycle(reportId: string) {
    const [signatures, shares, nextSteps, accesses] = await Promise.all([
      this.getSignatures(reportId),
      this.getShares(reportId),
      this.getNextSteps(reportId),
      prisma.reportAccess.findMany({
        where: { reportId },
        include: { accessedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return { signatures, shares, nextSteps, accesses };
  }

  /**
   * Get pending signatures for a user (reports they need to sign)
   */
  async getPendingSignatures(userId: string) {
    return prisma.reportSignature.findMany({
      where: { signerId: userId, status: ReportSignatureStatus.PENDING },
      include: {
        report: { select: { id: true, title: true, kind: true, status: true, patientId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get pending next steps for a patient
   */
  async getPendingNextSteps(patientId: string) {
    return prisma.reportNextStep.findMany({
      where: { patientId, status: { in: [NextStepStatus.PROPOSED, NextStepStatus.AGREED, NextStepStatus.SCHEDULED] } },
      include: {
        report: { select: { id: true, title: true, status: true } },
        clinician: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
