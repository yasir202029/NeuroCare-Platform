import { Prisma, ConsentType, OnboardingStage, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, notFound } from '../../shared/errors.js';

type OnboardingProfileData = {
  nhsNumber?: string;
  dateOfBirth?: string;
  sexAtBirth?: string;
  gender?: string;
  address?: Record<string, string>;
  emergencyContact?: Record<string, string>;
  preferredContact?: string;
  consentToContact?: boolean;
  medicalHistory?: string;
  currentMedication?: Array<Record<string, string>>;
  accessibilityNeeds?: string;
};

type ConsentRecord = {
  type: string;
  version: string;
  granted: boolean;
  legalBasis?: string;
  description?: string;
};

export class OnboardingService {
  /**
   * Get patient onboarding state and next steps
   */
  async getOnboardingState(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        onboardingStage: true,
        nhsNumberCipher: true,
        dateOfBirth: true,
        sexAtBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        preferredContact: true,
        consentToContact: true,
        medicalHistory: true,
        currentMedication: true,
        accessibilityNeeds: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!patient) throw notFound('Patient profile not found');

    // Determine completion percentage
    const fields = [
      patient.nhsNumberCipher,
      patient.dateOfBirth,
      patient.sexAtBirth,
      patient.gender,
      patient.address,
      patient.emergencyContact,
      patient.medicalHistory,
      patient.accessibilityNeeds,
    ];
    const completed = fields.filter(Boolean).length;
    const completion = Math.round((completed / fields.length) * 100);

    // Determine next stage
    let nextStage: string;
    if (!patient.nhsNumberCipher) nextStage = 'identity';
    else if (!patient.dateOfBirth || !patient.sexAtBirth || !patient.gender) nextStage = 'demographics';
    else if (!patient.address || !patient.emergencyContact) nextStage = 'contact';
    else if (!patient.medicalHistory) nextStage = 'medical-history';
    else if (!patient.accessibilityNeeds) nextStage = 'accessibility';
    else nextStage = 'complete';

    return {
      patientId: patient.id,
      stage: patient.onboardingStage,
      nextStage,
      completion,
      profile: patient,
      canBookAppointment: patient.onboardingStage === OnboardingStage.COMPLETED || patient.onboardingStage === OnboardingStage.IDENTITY_VERIFIED,
    };
  }

  /**
   * Update onboarding profile (progressive profiling)
   */
  async updateProfile(userId: string, data: OnboardingProfileData) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient) throw notFound('Patient profile not found');

    // Determine new stage based on what's filled
    let newStage = patient.onboardingStage;
    const hasIdentity = data.nhsNumber || patient.nhsNumberCipher;
    const hasDemographics = (data.dateOfBirth || patient.dateOfBirth) && (data.sexAtBirth || patient.sexAtBirth) && (data.gender || patient.gender);
    const hasContact = (data.address || patient.address) && (data.emergencyContact || patient.emergencyContact);
    const hasMedical = data.medicalHistory || patient.medicalHistory;
    const hasAccessibility = data.accessibilityNeeds || patient.accessibilityNeeds;

    if (hasIdentity && !hasDemographics) newStage = OnboardingStage.IDENTITY_VERIFIED;
    else if (hasIdentity && hasDemographics && !hasContact) newStage = OnboardingStage.DEMOGRAPHICS_COMPLETE;
    else if (hasIdentity && hasDemographics && hasContact && !hasMedical) newStage = OnboardingStage.CONTACT_COMPLETE;
    else if (hasIdentity && hasDemographics && hasContact && hasMedical && !hasAccessibility) newStage = OnboardingStage.MEDICAL_HISTORY_COMPLETE;
    else if (hasIdentity && hasDemographics && hasContact && hasMedical && hasAccessibility) newStage = OnboardingStage.COMPLETED;

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...(data.nhsNumber !== undefined && { nhsNumberCipher: data.nhsNumber }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.sexAtBirth !== undefined && { sexAtBirth: data.sexAtBirth }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.address !== undefined && { address: data.address as Prisma.InputJsonValue }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact as Prisma.InputJsonValue }),
        ...(data.preferredContact !== undefined && { preferredContact: data.preferredContact }),
        ...(data.consentToContact !== undefined && { consentToContact: data.consentToContact }),
        ...(data.medicalHistory !== undefined && { medicalHistory: data.medicalHistory }),
        ...(data.currentMedication !== undefined && { currentMedication: data.currentMedication as Prisma.InputJsonValue }),
        ...(data.accessibilityNeeds !== undefined && { accessibilityNeeds: data.accessibilityNeeds }),
        onboardingStage: newStage,
      },
    });

    return { patient: updated, stage: newStage };
  }

  /**
   * Record consent
   */
  async recordConsent(userId: string, consents: ConsentRecord[]) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient) throw notFound('Patient profile not found');

    const records = await prisma.$transaction(
      consents.map((c) =>
        prisma.consentRecord.create({
          data: {
            patientId: patient.id,
            type: c.type as ConsentType,
            version: c.version,
            granted: c.granted,
            evidence: c.legalBasis ? { legalBasis: c.legalBasis } as Prisma.InputJsonValue : undefined,
          },
        }),
      ),
    );

    return records;
  }

  /**
   * Get consents for patient
   */
  async getConsents(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!patient) throw notFound('Patient profile not found');

    return prisma.consentRecord.findMany({
      where: { patientId: patient.id },
      orderBy: [{ recordedAt: 'desc' }],
    });
  }

  /**
   * Complete onboarding and unlock booking
   */
  async completeOnboarding(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient) throw notFound('Patient profile not found');

    // Verify minimum required fields
    if (!patient.nhsNumberCipher || !patient.dateOfBirth || !patient.sexAtBirth || !patient.gender) {
      throw badRequest('Identity and demographic information required to complete onboarding');
    }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: { onboardingStage: OnboardingStage.COMPLETED },
    });

    return { patient: updated, stage: OnboardingStage.COMPLETED, canBook: true };
  }

  /**
   * Get onboarding journey steps for frontend
   */
  async getJourneySteps() {
    return [
      { id: 'identity', label: 'Identity & NHS Number', stage: OnboardingStage.IDENTITY_VERIFIED, required: true },
      { id: 'demographics', label: 'Demographics', stage: OnboardingStage.DEMOGRAPHICS_COMPLETE, required: true },
      { id: 'contact', label: 'Contact & Emergency', stage: OnboardingStage.CONTACT_COMPLETE, required: true },
      { id: 'medical-history', label: 'Medical History', stage: OnboardingStage.MEDICAL_HISTORY_COMPLETE, required: true },
      { id: 'accessibility', label: 'Accessibility Needs', stage: OnboardingStage.COMPLETED, required: false },
      { id: 'consent', label: 'Consent & Privacy', stage: OnboardingStage.COMPLETED, required: true },
      { id: 'screening', label: 'Clinical Screening', stage: OnboardingStage.COMPLETED, required: true },
      { id: 'booking', label: 'Book Assessment', stage: OnboardingStage.COMPLETED, required: true },
    ];
  }
}
