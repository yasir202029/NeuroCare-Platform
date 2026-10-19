-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PSYCHIATRIST', 'PRESCRIBER', 'NURSE', 'PATIENT', 'FINANCE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('ADHD', 'AUTISM');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'INTAKE', 'SCREENING', 'CLINICAL_REVIEW', 'REPORTING', 'COMPLETE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DID_NOT_ATTEND');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('VIDEO', 'PHONE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('TEAMS', 'ZOOM');

-- CreateEnum
CREATE TYPE "SessionEventType" AS ENUM ('SESSION_CREATED', 'WAITING_ROOM_OPENED', 'PARTICIPANT_JOINED', 'PARTICIPANT_LEFT', 'SESSION_STARTED', 'RECORDING_STARTED', 'RECORDING_STOPPED', 'SESSION_ENDED');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('REQUESTED', 'RECORDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CONSULTATION', 'PROGRESS', 'MEDICATION_REVIEW', 'SAFEGUARDING', 'PHYSICAL_HEALTH');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SCHOOL_REPORT', 'BLOOD_TEST', 'ECG_RESULT', 'GP_LETTER', 'PHYSICAL_HEALTH', 'ASSESSMENT_FORM', 'ASSESSMENT_REPORT', 'CLINICAL_LETTER', 'SIGNED_PRESCRIPTION', 'INVOICE', 'ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ServiceLine" AS ENUM ('ADHD_ASSESSMENT', 'AUTISM_ASSESSMENT', 'FOLLOW_UP', 'MEDICATION_REVIEW', 'REPORT', 'PRESCRIPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RevenueEventType" AS ENUM ('PAYMENT_RECEIVED', 'REFUND_ISSUED', 'INVOICE_VOIDED', 'CLINICIAN_EARNING_ACCRUED');

-- CreateEnum
CREATE TYPE "MetricGranularity" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_REMINDER', 'REPORT_READY', 'PAYMENT_UPDATE', 'DOCUMENT_MISSING', 'TASK_ASSIGNED');

-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('TOTP', 'EMAIL');

-- CreateEnum
CREATE TYPE "MfaChallengeType" AS ENUM ('EMAIL_LOGIN', 'EMAIL_ENROLLMENT');

-- CreateEnum
CREATE TYPE "SecurityAlertType" AS ENUM ('NEW_DEVICE', 'LOGIN_FAILURES', 'PASSWORD_CHANGED', 'MFA_CHANGED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_LOGIN');

-- CreateEnum
CREATE TYPE "ScreeningInstrument" AS ENUM ('ASRS', 'WURS', 'DIVA', 'PHQ9', 'GAD7', 'AQ50', 'RAADS_R', 'CAT_Q', 'INFORMANT_FORM', 'DEVELOPMENTAL_HISTORY');

-- CreateEnum
CREATE TYPE "WorkflowEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TitrationStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'SENT', 'DISPENSED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'TRACKING_ASSIGNED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('PENDING_NOTE', 'PENDING_REPORT', 'PENDING_PRESCRIPTION', 'MISSING_DOCUMENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('NOT_STARTED', 'IDENTITY_VERIFIED', 'DEMOGRAPHICS_COMPLETE', 'CONTACT_COMPLETE', 'MEDICAL_HISTORY_COMPLETE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('RATING', 'FFT', 'NPS', 'COMMENT');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AiRunType" AS ENUM ('TRANSCRIPTION', 'SPEAKER_SEPARATION', 'SUMMARY', 'ACTION_ITEMS', 'RISK_FLAGS', 'NOTE_DRAFT', 'REPORT_DRAFT', 'LETTER_DRAFT', 'MESSAGE_SUGGESTION', 'MESSAGE_SUMMARY');

-- CreateEnum
CREATE TYPE "AiRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "AiDocumentType" AS ENUM ('ADHD_REPORT', 'AUTISM_REPORT', 'FOLLOW_UP_REPORT', 'MEDICATION_REVIEW_REPORT', 'GP_LETTER', 'SHARED_CARE_LETTER', 'CONSULTATION_NOTE');

-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('ADHD_INITIAL', 'ADHD_FOLLOW_UP', 'ADHD_TITRATION', 'ADHD_SHARED_CARE', 'ADHD_DISCHARGE', 'AUTISM_ASSESSMENT', 'AUTISM_DEVELOPMENTAL_HISTORY', 'AUTISM_INFORMANT', 'AUTISM_DIAGNOSTIC', 'GP_LETTER', 'SHARED_CARE_LETTER', 'SCHOOL_LETTER', 'EMPLOYER_LETTER', 'SUPPORTING_EVIDENCE_LETTER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'SHARED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiTransformAction" AS ENUM ('GENERATE', 'REWRITE', 'EXPAND', 'SHORTEN', 'IMPROVE_GRAMMAR', 'GP_FORMAT', 'PATIENT_FRIENDLY');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('DATA_PROCESSING', 'RECORDING', 'AI_TRANSCRIPTION', 'DOCUMENT_SHARING', 'SHARED_CARE');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('ASSESSMENT', 'TITRATION', 'PRESCRIBING', 'NURSING', 'ADMINISTRATION', 'FINANCE', 'CLINICAL_GOVERNANCE');

-- CreateEnum
CREATE TYPE "PatientAssignmentRole" AS ENUM ('LEAD_CLINICIAN', 'ASSESSMENT_CLINICIAN', 'TITRATION_CLINICIAN', 'PRESCRIBER', 'NURSE', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('REFERRAL', 'ADMIN_TRIAGE', 'ASSESSMENT', 'DIAGNOSIS', 'MORE_INFORMATION_REQUIRED', 'ECG_REQUESTED', 'ASSESSMENT_REVIEW', 'TITRATION', 'PRESCRIBING', 'SHARED_CARE', 'DISCHARGE', 'OUTCOME', 'DIAGNOSIS_NOT_CONFIRMED');

-- CreateEnum
CREATE TYPE "TeamQueueType" AS ENUM ('AWAITING_ASSESSMENT', 'AWAITING_REPORT', 'AWAITING_INFORMATION', 'AWAITING_MEDICATION_START', 'ACTIVE_TITRATION', 'MEDICATION_REVIEW_DUE', 'PRESCRIPTION_AWAITING_APPROVAL', 'PRESCRIPTION_AWAITING_SIGNATURE', 'CONTROLLED_DRUG_REVIEW', 'PHYSICAL_HEALTH_REVIEW', 'SIDE_EFFECT_MONITORING', 'MISSING_DOCUMENT', 'APPOINTMENT_BOOKING', 'INVOICE_ISSUE');

-- CreateEnum
CREATE TYPE "TeamQueueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CoverStatus" AS ENUM ('PLANNED', 'ACTIVE', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportSignatureMethod" AS ENUM ('DIGITAL', 'BIOMETRIC', 'SMART_CARD', 'TOTP_VERIFIED');

-- CreateEnum
CREATE TYPE "ReportSignatureStatus" AS ENUM ('PENDING', 'SIGNED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReportSharePurpose" AS ENUM ('PATIENT_VIEW', 'CLINICIAN_REVIEW', 'GP_SHARED_CARE', 'SCHOOL_REFERRAL', 'EMPLOYER_ADJUSTMENT', 'LEGAL_REQUEST', 'RESEARCH_ANONYMISED');

-- CreateEnum
CREATE TYPE "ReportShareStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "NextStepType" AS ENUM ('FOLLOW_UP_APPOINTMENT', 'MEDICATION_REVIEW', 'TITRATION_ADJUSTMENT', 'REFERRAL', 'SHARED_CARE_SETUP', 'PHYSICAL_HEALTH_CHECK', 'PSYCHOLOGICAL_INTERVENTION', 'DISCHARGE', 'CRISIS_INTERVENTION');

-- CreateEnum
CREATE TYPE "NextStepStatus" AS ENUM ('PROPOSED', 'AGREED', 'SCHEDULED', 'COMPLETED', 'DECLINED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RiskBand" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AiInsightType" AS ENUM ('SYMPTOM_PATTERN', 'MEDICATION_RESPONSE', 'RISK_PREDICTION', 'TITRATION_ADJUSTMENT', 'SAFETY_FLAG', 'CLINICAL_REMINDER');

-- CreateEnum
CREATE TYPE "AiTemplateType" AS ENUM ('GP_LETTER', 'SHARED_CARE_LETTER', 'ASSESSMENT_REPORT', 'TITRATION_PLAN', 'MEDICATION_REVIEW', 'REFERRAL_LETTER');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "VitalType" AS ENUM ('HEART_RATE', 'BLOOD_PRESSURE_SYSTOLIC', 'BLOOD_PRESSURE_DIASTOLIC', 'TEMPERATURE', 'OXYGEN_SATURATION', 'RESPIRATORY_RATE', 'WEIGHT', 'SLEEP_HOURS');

-- CreateEnum
CREATE TYPE "SymptomSeverity" AS ENUM ('NONE', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AdherenceStatus" AS ENUM ('TAKEN', 'MISSED', 'LATE', 'REFUSED');

-- CreateEnum
CREATE TYPE "GpCommunicationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'ACKNOWLEDGED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "GpRecordUpdateType" AS ENUM ('MEDICATION_CHANGE', 'DIAGNOSIS_UPDATE', 'ALLERGY_UPDATE', 'VITAL_UPDATE', 'REFERRAL', 'DISCHARGE_SUMMARY', 'OTHER');

-- CreateEnum
CREATE TYPE "GpRecordUpdateStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "HookEvent" AS ENUM ('PATIENT_CREATED', 'PATIENT_UPDATED', 'ASSESSMENT_COMPLETED', 'MEDICATION_PRESCRIBED', 'TITRATION_ADJUSTED', 'RISK_SCORE_CALCULATED', 'SAFETY_ALERT_TRIGGERED', 'CLINICAL_ALERT_ACKNOWLEDGED', 'GP_COMMUNICATION_SENT', 'GP_RECORD_UPDATED', 'REPORT_SIGNED', 'REPORT_SHARED', 'ONBOARDING_COMPLETED', 'LIVE_DATA_INGESTED');

-- CreateEnum
CREATE TYPE "HookStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "RailSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RailAction" AS ENUM ('BLOCK', 'WARN', 'LOG', 'REQUIRE_APPROVAL');

-- CreateEnum
CREATE TYPE "RailScope" AS ENUM ('GLOBAL', 'ROLE', 'PATIENT', 'ORGANIZATION');

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TeamType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAssignment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "role" "PatientAssignmentRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT,
    "assignedById" TEXT,

    CONSTRAINT "PatientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "teamId" TEXT,
    "actorId" TEXT,
    "fromStage" "WorkflowStage",
    "toStage" "WorkflowStage" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamQueueItem" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "type" "TeamQueueType" NOT NULL,
    "status" "TeamQueueStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverArrangement" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "patientAssignmentId" TEXT NOT NULL,
    "originalUserId" TEXT NOT NULL,
    "coveringUserId" TEXT NOT NULL,
    "status" "CoverStatus" NOT NULL DEFAULT 'PLANNED',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT,
    "notificationSentAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverArrangement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "roles" "Role"[],
    "emailVerifiedAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "MfaMethod" NOT NULL,
    "secretCipher" TEXT NOT NULL,
    "label" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "refreshTokenId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaChallengeType" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "label" TEXT,
    "platform" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "SecurityAlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nhsNumberCipher" TEXT,
    "nhsNumberHash" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "sexAtBirth" TEXT,
    "gender" TEXT,
    "address" JSONB,
    "emergencyContact" JSONB,
    "preferredContact" TEXT,
    "consentToContact" BOOLEAN NOT NULL DEFAULT false,
    "medicalHistory" TEXT,
    "currentMedication" JSONB,
    "accessibilityNeeds" TEXT,
    "onboardingStage" "OnboardingStage" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientContact" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinician" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationBody" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "specialisms" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "mode" "AppointmentMode" NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "availabilityId" TEXT,
    "type" "AssessmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "mode" "AppointmentMode" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "cancellationReason" TEXT,
    "lastUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSession" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "provider" "VideoProvider" NOT NULL,
    "providerSessionId" TEXT,
    "joinUrl" TEXT,
    "clinicianJoinUrl" TEXT,
    "waitingRoomOpenedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,

    CONSTRAINT "VideoSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoSessionEvent" (
    "id" TEXT NOT NULL,
    "videoSessionId" TEXT NOT NULL,
    "type" "SessionEventType" NOT NULL,
    "participantRole" TEXT,
    "participantId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "videoSessionId" TEXT NOT NULL,
    "providerRecordingId" TEXT,
    "status" "RecordingStatus" NOT NULL DEFAULT 'REQUESTED',
    "storageBucket" TEXT,
    "storagePath" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientJoinedAt" TIMESTAMP(3),
    "clinicianJoinedAt" TIMESTAMP(3),
    "patientLeftAt" TIMESTAMP(3),
    "clinicianLeftAt" TIMESTAMP(3),
    "patientPresent" BOOLEAN NOT NULL DEFAULT false,
    "clinicianPresent" BOOLEAN NOT NULL DEFAULT false,
    "missedReason" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "videoSessionId" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "consentText" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "type" "AssessmentType" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "formulation" TEXT,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentWorkflowEvent" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "type" "WorkflowEventType" NOT NULL,
    "fromStatus" "AssessmentStatus",
    "toStatus" "AssessmentStatus",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentWorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningResponse" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "instrument" "ScreeningInstrument" NOT NULL,
    "formKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DECIMAL(8,2),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdhdAssessment" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "symptomProfile" JSONB,
    "impairmentProfile" JSONB,

    CONSTRAINT "AdhdAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutismAssessment" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "communicationProfile" JSONB,
    "sensoryProfile" JSONB,
    "developmentalHistory" JSONB,
    "informantDetails" JSONB,

    CONSTRAINT "AutismAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitrationPlan" (
    "id" TEXT NOT NULL,
    "adhdAssessmentId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "status" "TitrationStatus" NOT NULL DEFAULT 'PLANNED',
    "targetMedication" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "reviewIntervalDays" INTEGER,

    CONSTRAINT "TitrationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitrationReview" (
    "id" TEXT NOT NULL,
    "titrationPlanId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "dose" TEXT,
    "response" TEXT,
    "sideEffects" TEXT,
    "bloodPressure" TEXT,
    "pulse" INTEGER,
    "weightKg" DECIMAL(6,2),
    "nextReviewAt" TIMESTAMP(3),

    CONSTRAINT "TitrationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationReview" (
    "id" TEXT NOT NULL,
    "adhdAssessmentId" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dose" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "response" TEXT,
    "sideEffects" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCareAgreement" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "gpName" TEXT,
    "gpPractice" TEXT,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedCareAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalHealthReview" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "pulse" INTEGER,
    "weightKg" DECIMAL(6,2),
    "heightCm" DECIMAL(6,2),
    "bmi" DECIMAL(5,2),
    "sleepHours" DECIMAL(4,2),
    "appetite" TEXT,
    "sideEffects" TEXT,
    "notes" TEXT,

    CONSTRAINT "PhysicalHealthReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalHealthAlert" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalHealthAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" "NoteType" NOT NULL,
    "content" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalNoteVersion" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalNoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "noteId" TEXT,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "invoiceId" TEXT,
    "prescriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'supabase',
    "storageBucket" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "encryptionKeyRef" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "repeatRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "strength" TEXT,
    "dose" TEXT,
    "quantity" TEXT,
    "instructions" TEXT,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionStatusEvent" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierShipment" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "courierName" TEXT,
    "trackingId" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "qrCodeValue" TEXT,
    "proofDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB,

    CONSTRAINT "CourierEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSession" (
    "id" TEXT NOT NULL,
    "videoSessionId" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AiSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSummary" (
    "id" TEXT NOT NULL,
    "aiSessionId" TEXT NOT NULL,
    "consultationNotes" TEXT,
    "adhdSummary" TEXT,
    "autismSummary" TEXT,
    "followUpNotes" TEXT,
    "gpLetter" TEXT,
    "sharedCareLetter" TEXT,
    "draftReport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExtraction" (
    "id" TEXT NOT NULL,
    "aiSessionId" TEXT NOT NULL,
    "actionItems" JSONB,
    "riskFlags" JSONB,
    "diagnoses" JSONB,
    "medications" JSONB,
    "physicalHealth" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTranscript" (
    "id" TEXT NOT NULL,
    "aiSessionId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-GB',
    "storagePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTranscriptSegment" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "speaker" TEXT,
    "content" TEXT NOT NULL,
    "startsAtMs" INTEGER NOT NULL,
    "endsAtMs" INTEGER NOT NULL,

    CONSTRAINT "AiTranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "aiSessionId" TEXT NOT NULL,
    "type" "AiRunType" NOT NULL,
    "status" "AiRunStatus" NOT NULL DEFAULT 'QUEUED',
    "model" TEXT,
    "promptVersion" TEXT,
    "inputHash" TEXT,
    "output" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneratedDocument" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT,
    "noteId" TEXT,
    "reviewerId" TEXT,
    "type" "AiDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AiRunStatus" NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "sourceRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ReportKind" NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "clinicianId" TEXT,
    "templateId" TEXT,
    "kind" "ReportKind" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportVersion" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT,
    "aiOutputId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiOutput" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "type" "AiRunType" NOT NULL,
    "action" "AiTransformAction" NOT NULL DEFAULT 'GENERATE',
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB,
    "outputContent" TEXT NOT NULL,
    "status" "AiRunStatus" NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAuditEvent" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSignature" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "method" "ReportSignatureMethod" NOT NULL DEFAULT 'DIGITAL',
    "status" "ReportSignatureStatus" NOT NULL DEFAULT 'PENDING',
    "signatureHash" TEXT,
    "signedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedWithId" TEXT,
    "purpose" "ReportSharePurpose" NOT NULL,
    "status" "ReportShareStatus" NOT NULL DEFAULT 'PENDING',
    "accessToken" TEXT,
    "accessExpiresAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAccess" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "accessedById" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportNextStep" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "NextStepType" NOT NULL,
    "status" "NextStepStatus" NOT NULL DEFAULT 'PROPOSED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "clinicianId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportNextStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "subject" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT,
    "channel" "MessageChannel" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessageSuggestion" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT,
    "urgency" TEXT,
    "status" "AiRunStatus" NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessageSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'gbp',
    "subtotalPence" INTEGER NOT NULL,
    "totalPence" INTEGER NOT NULL,
    "serviceLine" "ServiceLine" NOT NULL DEFAULT 'OTHER',
    "dueAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amountPence" INTEGER NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "providerEventId" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicianEarning" (
    "id" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "assessments" INTEGER NOT NULL DEFAULT 0,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "prescriptions" INTEGER NOT NULL DEFAULT 0,
    "amountPence" INTEGER NOT NULL DEFAULT 0,
    "paidAmountPence" INTEGER NOT NULL DEFAULT 0,
    "dueAmountPence" INTEGER NOT NULL DEFAULT 0,
    "serviceBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicianEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "status" "PaymentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "installmentCount" INTEGER NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlanInstallment" (
    "id" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "stripePaymentId" TEXT,

    CONSTRAINT "PaymentPlanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amountPence" INTEGER NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "providerEventId" TEXT,
    "patientId" TEXT,
    "clinicianId" TEXT,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "serviceLine" "ServiceLine" NOT NULL,
    "type" "RevenueEventType" NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "granularity" "MetricGranularity" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "count" INTEGER,
    "dimensions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTask" (
    "id" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "patientId" TEXT,
    "clinicianId" TEXT,
    "assignedToId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "rating" INTEGER,
    "score" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintEvent" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "evidence" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'WARNING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalFormDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "instrument" "ScreeningInstrument",
    "category" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalFormDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalFormSubmission" (
    "id" TEXT NOT NULL,
    "formDefinitionId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "answers" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalRiskScore" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "riskBand" "RiskBand" NOT NULL,
    "factors" JSONB NOT NULL,
    "niceAligned" BOOLEAN NOT NULL DEFAULT true,
    "reviewedAt" TIMESTAMP(3),
    "nextReviewDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientRanking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "rankPosition" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT,
    "portal" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationSafetyAlert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "alertType" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'WARNING',
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationSafetyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "AiInsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "sourceRunId" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AiTemplateType" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "description" TEXT,
    "pricePence" INTEGER NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "planId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "branding" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMeter" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPct" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "TrialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientVitalSigns" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "VitalType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "deviceId" TEXT,
    "notes" TEXT,
    "isAnomalous" BOOLEAN NOT NULL DEFAULT false,
    "anomalyScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientVitalSigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSymptomEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "symptom" TEXT NOT NULL,
    "severity" "SymptomSeverity" NOT NULL DEFAULT 'MILD',
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'patient',
    "triggeredAlert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientSymptomEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAdherenceLog" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dose" TEXT,
    "status" "AdherenceStatus" NOT NULL DEFAULT 'TAKEN',
    "takenAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "sideEffects" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationAdherenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearableDevice" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WearableDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearableDataPoint" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WearableDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAlert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'WARNING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveDataStreamEvent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveDataStreamEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpCommunication" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "assessmentId" TEXT,
    "prescriptionId" TEXT,
    "gpName" TEXT NOT NULL,
    "gpPractice" TEXT NOT NULL,
    "gpEmail" TEXT,
    "gpNhsNumber" TEXT,
    "communicationType" TEXT NOT NULL,
    "status" "GpCommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sharedCareAgreementId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GpCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpRecordUpdate" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "gpCommunicationId" TEXT,
    "gpName" TEXT NOT NULL,
    "gpPractice" TEXT NOT NULL,
    "gpNhsNumber" TEXT,
    "updateType" "GpRecordUpdateType" NOT NULL,
    "status" "GpRecordUpdateStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clinicalData" JSONB NOT NULL,
    "currentValue" JSONB,
    "newValue" JSONB,
    "appliedById" TEXT,
    "appliedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "requiresClinicianApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GpRecordUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event" "HookEvent" NOT NULL,
    "status" "HookStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetUrl" TEXT,
    "secret" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "handlerName" TEXT,
    "config" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HookExecution" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "event" "HookEvent" NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HookExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rail" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event" "HookEvent" NOT NULL,
    "scope" "RailScope" NOT NULL DEFAULT 'GLOBAL',
    "scopeValue" TEXT,
    "severity" "RailSeverity" NOT NULL DEFAULT 'WARNING',
    "action" "RailAction" NOT NULL DEFAULT 'WARN',
    "condition" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RailViolation" (
    "id" TEXT NOT NULL,
    "railId" TEXT NOT NULL,
    "event" "HookEvent" NOT NULL,
    "patientId" TEXT,
    "actorId" TEXT,
    "severity" "RailSeverity" NOT NULL,
    "actionTaken" "RailAction" NOT NULL,
    "context" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RailViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCoordination" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastHeartbeat" TIMESTAMP(3),
    "lastCheck" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCoordination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_permissionId_key" ON "RolePermission"("role", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_role_revokedAt_idx" ON "UserRole"("role", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE INDEX "TeamMember_userId_active_idx" ON "TeamMember"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "PatientAssignment_patientId_role_active_idx" ON "PatientAssignment"("patientId", "role", "active");

-- CreateIndex
CREATE INDEX "PatientAssignment_teamId_active_idx" ON "PatientAssignment"("teamId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAssignment_patientId_role_userId_startsAt_key" ON "PatientAssignment"("patientId", "role", "userId", "startsAt");

-- CreateIndex
CREATE INDEX "WorkflowTransition_patientId_createdAt_idx" ON "WorkflowTransition"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowTransition_teamId_toStage_createdAt_idx" ON "WorkflowTransition"("teamId", "toStage", "createdAt");

-- CreateIndex
CREATE INDEX "TeamQueueItem_teamId_status_priority_dueAt_idx" ON "TeamQueueItem"("teamId", "status", "priority", "dueAt");

-- CreateIndex
CREATE INDEX "TeamQueueItem_patientId_status_idx" ON "TeamQueueItem"("patientId", "status");

-- CreateIndex
CREATE INDEX "CoverArrangement_coveringUserId_status_startsAt_idx" ON "CoverArrangement"("coveringUserId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "CoverArrangement_originalUserId_status_endsAt_idx" ON "CoverArrangement"("originalUserId", "status", "endsAt");

-- CreateIndex
CREATE INDEX "CoverArrangement_patientId_status_idx" ON "CoverArrangement"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "MfaFactor_userId_method_idx" ON "MfaFactor"("userId", "method");

-- CreateIndex
CREATE UNIQUE INDEX "MfaFactor_userId_method_key" ON "MfaFactor"("userId", "method");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshTokenId_key" ON "UserSession"("refreshTokenId");

-- CreateIndex
CREATE INDEX "UserSession_userId_revokedAt_idx" ON "UserSession"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_expiresAt_idx" ON "RefreshToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "MfaChallenge_userId_type_expiresAt_idx" ON "MfaChallenge"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "Device_userId_revokedAt_lastSeenAt_idx" ON "Device"("userId", "revokedAt", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_fingerprintHash_key" ON "Device"("userId", "fingerprintHash");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_createdAt_idx" ON "LoginHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginHistory_email_success_createdAt_idx" ON "LoginHistory"("email", "success", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_userId_acknowledgedAt_createdAt_idx" ON "SecurityAlert"("userId", "acknowledgedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_nhsNumberHash_key" ON "Patient"("nhsNumberHash");

-- CreateIndex
CREATE INDEX "PatientContact_patientId_isEmergency_idx" ON "PatientContact"("patientId", "isEmergency");

-- CreateIndex
CREATE UNIQUE INDEX "Clinician_userId_key" ON "Clinician"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinician_registrationBody_registrationNumber_key" ON "Clinician"("registrationBody", "registrationNumber");

-- CreateIndex
CREATE INDEX "Availability_clinicianId_startsAt_idx" ON "Availability"("clinicianId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_availabilityId_key" ON "Appointment"("availabilityId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_startsAt_idx" ON "Appointment"("patientId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_clinicianId_startsAt_idx" ON "Appointment"("clinicianId", "startsAt");

-- CreateIndex
CREATE INDEX "AppointmentStatusEvent_appointmentId_createdAt_idx" ON "AppointmentStatusEvent"("appointmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoSession_appointmentId_key" ON "VideoSession"("appointmentId");

-- CreateIndex
CREATE INDEX "VideoSessionEvent_videoSessionId_occurredAt_idx" ON "VideoSessionEvent"("videoSessionId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Recording_videoSessionId_key" ON "Recording"("videoSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_appointmentId_key" ON "AttendanceRecord"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingConsent_patientId_videoSessionId_key" ON "RecordingConsent"("patientId", "videoSessionId");

-- CreateIndex
CREATE INDEX "Assessment_patientId_type_status_idx" ON "Assessment"("patientId", "type", "status");

-- CreateIndex
CREATE INDEX "AssessmentWorkflowEvent_assessmentId_createdAt_idx" ON "AssessmentWorkflowEvent"("assessmentId", "createdAt");

-- CreateIndex
CREATE INDEX "ScreeningResponse_patientId_instrument_idx" ON "ScreeningResponse"("patientId", "instrument");

-- CreateIndex
CREATE INDEX "ScreeningResponse_assessmentId_instrument_idx" ON "ScreeningResponse"("assessmentId", "instrument");

-- CreateIndex
CREATE UNIQUE INDEX "AdhdAssessment_assessmentId_key" ON "AdhdAssessment"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AutismAssessment_assessmentId_key" ON "AutismAssessment"("assessmentId");

-- CreateIndex
CREATE INDEX "TitrationPlan_clinicianId_status_idx" ON "TitrationPlan"("clinicianId", "status");

-- CreateIndex
CREATE INDEX "TitrationReview_titrationPlanId_reviewDate_idx" ON "TitrationReview"("titrationPlanId", "reviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCareAgreement_documentId_key" ON "SharedCareAgreement"("documentId");

-- CreateIndex
CREATE INDEX "PhysicalHealthReview_patientId_reviewDate_idx" ON "PhysicalHealthReview"("patientId", "reviewDate");

-- CreateIndex
CREATE INDEX "ClinicalNote_patientId_createdAt_idx" ON "ClinicalNote"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNoteVersion_noteId_version_key" ON "ClinicalNoteVersion"("noteId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Document_invoiceId_key" ON "Document"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_prescriptionId_key" ON "Document"("prescriptionId");

-- CreateIndex
CREATE INDEX "Document_patientId_type_createdAt_idx" ON "Document"("patientId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "DocumentAccessLog_documentId_createdAt_idx" ON "DocumentAccessLog"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_patientId_status_idx" ON "Prescription"("patientId", "status");

-- CreateIndex
CREATE INDEX "Prescription_clinicianId_status_idx" ON "Prescription"("clinicianId", "status");

-- CreateIndex
CREATE INDEX "PrescriptionStatusEvent_prescriptionId_createdAt_idx" ON "PrescriptionStatusEvent"("prescriptionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourierShipment_qrCodeValue_key" ON "CourierShipment"("qrCodeValue");

-- CreateIndex
CREATE UNIQUE INDEX "CourierShipment_proofDocumentId_key" ON "CourierShipment"("proofDocumentId");

-- CreateIndex
CREATE INDEX "CourierEvent_shipmentId_occurredAt_idx" ON "CourierEvent"("shipmentId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiSession_videoSessionId_key" ON "AiSession"("videoSessionId");

-- CreateIndex
CREATE INDEX "AiSession_startedAt_idx" ON "AiSession"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiSummary_aiSessionId_key" ON "AiSummary"("aiSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AiExtraction_aiSessionId_key" ON "AiExtraction"("aiSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AiTranscript_aiSessionId_key" ON "AiTranscript"("aiSessionId");

-- CreateIndex
CREATE INDEX "AiTranscriptSegment_transcriptId_startsAtMs_idx" ON "AiTranscriptSegment"("transcriptId", "startsAtMs");

-- CreateIndex
CREATE INDEX "AiRun_aiSessionId_type_createdAt_idx" ON "AiRun"("aiSessionId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiGeneratedDocument_noteId_key" ON "AiGeneratedDocument"("noteId");

-- CreateIndex
CREATE INDEX "AiGeneratedDocument_assessmentId_type_status_idx" ON "AiGeneratedDocument"("assessmentId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_key_key" ON "ReportTemplate"("key");

-- CreateIndex
CREATE INDEX "ReportTemplate_kind_active_idx" ON "ReportTemplate"("kind", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplateVersion_templateId_version_key" ON "ReportTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "Report_patientId_kind_status_idx" ON "Report"("patientId", "kind", "status");

-- CreateIndex
CREATE INDEX "Report_clinicianId_status_updatedAt_idx" ON "Report"("clinicianId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportVersion_aiOutputId_key" ON "ReportVersion"("aiOutputId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportVersion_reportId_version_key" ON "ReportVersion"("reportId", "version");

-- CreateIndex
CREATE INDEX "AiOutput_reportId_action_createdAt_idx" ON "AiOutput"("reportId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "ReportAuditEvent_reportId_createdAt_idx" ON "ReportAuditEvent"("reportId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSignature_signatureHash_key" ON "ReportSignature"("signatureHash");

-- CreateIndex
CREATE INDEX "ReportSignature_reportId_status_idx" ON "ReportSignature"("reportId", "status");

-- CreateIndex
CREATE INDEX "ReportSignature_signerId_status_idx" ON "ReportSignature"("signerId", "status");

-- CreateIndex
CREATE INDEX "ReportSignature_signatureHash_idx" ON "ReportSignature"("signatureHash");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSignature_reportId_signerId_key" ON "ReportSignature"("reportId", "signerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportShare_accessToken_key" ON "ReportShare"("accessToken");

-- CreateIndex
CREATE INDEX "ReportShare_reportId_status_idx" ON "ReportShare"("reportId", "status");

-- CreateIndex
CREATE INDEX "ReportShare_patientId_status_idx" ON "ReportShare"("patientId", "status");

-- CreateIndex
CREATE INDEX "ReportShare_accessToken_idx" ON "ReportShare"("accessToken");

-- CreateIndex
CREATE INDEX "ReportShare_sharedById_createdAt_idx" ON "ReportShare"("sharedById", "createdAt");

-- CreateIndex
CREATE INDEX "ReportAccess_reportId_createdAt_idx" ON "ReportAccess"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportAccess_accessedById_createdAt_idx" ON "ReportAccess"("accessedById", "createdAt");

-- CreateIndex
CREATE INDEX "ReportAccess_patientId_createdAt_idx" ON "ReportAccess"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportNextStep_reportId_status_idx" ON "ReportNextStep"("reportId", "status");

-- CreateIndex
CREATE INDEX "ReportNextStep_patientId_status_idx" ON "ReportNextStep"("patientId", "status");

-- CreateIndex
CREATE INDEX "ReportNextStep_type_status_idx" ON "ReportNextStep"("type", "status");

-- CreateIndex
CREATE INDEX "ReportNextStep_scheduledAt_idx" ON "ReportNextStep"("scheduledAt");

-- CreateIndex
CREATE INDEX "MessageThread_patientId_updatedAt_idx" ON "MessageThread"("patientId", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_patientId_status_idx" ON "Invoice"("patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerEventId_key" ON "Payment"("providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicianEarning_clinicianId_periodStart_periodEnd_key" ON "ClinicianEarning"("clinicianId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_invoiceId_key" ON "PaymentPlan"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentPlanInstallment_dueAt_status_idx" ON "PaymentPlanInstallment"("dueAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlanInstallment_paymentPlanId_sequence_key" ON "PaymentPlanInstallment"("paymentPlanId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");

-- CreateIndex
CREATE INDEX "Refund_invoiceId_status_idx" ON "Refund"("invoiceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueEvent_providerEventId_key" ON "RevenueEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "RevenueEvent_occurredAt_serviceLine_type_idx" ON "RevenueEvent"("occurredAt", "serviceLine", "type");

-- CreateIndex
CREATE INDEX "RevenueEvent_clinicianId_occurredAt_idx" ON "RevenueEvent"("clinicianId", "occurredAt");

-- CreateIndex
CREATE INDEX "KpiSnapshot_metricKey_granularity_periodStart_idx" ON "KpiSnapshot"("metricKey", "granularity", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "KpiSnapshot_metricKey_granularity_periodStart_periodEnd_key" ON "KpiSnapshot"("metricKey", "granularity", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ClinicalTask_status_dueAt_idx" ON "ClinicalTask"("status", "dueAt");

-- CreateIndex
CREATE INDEX "ClinicalTask_clinicianId_status_idx" ON "ClinicalTask"("clinicianId", "status");

-- CreateIndex
CREATE INDEX "Feedback_type_createdAt_idx" ON "Feedback"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Complaint_status_priority_idx" ON "Complaint"("status", "priority");

-- CreateIndex
CREATE INDEX "ConsentRecord_patientId_type_recordedAt_idx" ON "ConsentRecord"("patientId", "type", "recordedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resource_resourceId_createdAt_idx" ON "AuditEvent"("resource", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_event_createdAt_idx" ON "SecurityEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalFormDefinition_key_key" ON "ClinicalFormDefinition"("key");

-- CreateIndex
CREATE INDEX "ClinicalFormDefinition_key_active_idx" ON "ClinicalFormDefinition"("key", "active");

-- CreateIndex
CREATE INDEX "ClinicalFormDefinition_category_idx" ON "ClinicalFormDefinition"("category");

-- CreateIndex
CREATE INDEX "ClinicalFormSubmission_formDefinitionId_patientId_idx" ON "ClinicalFormSubmission"("formDefinitionId", "patientId");

-- CreateIndex
CREATE INDEX "ClinicalFormSubmission_patientId_createdAt_idx" ON "ClinicalFormSubmission"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalRiskScore_patientId_createdAt_idx" ON "ClinicalRiskScore"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalRiskScore_riskBand_createdAt_idx" ON "ClinicalRiskScore"("riskBand", "createdAt");

-- CreateIndex
CREATE INDEX "PatientRanking_portal_rankPosition_idx" ON "PatientRanking"("portal", "rankPosition");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRanking_patientId_portal_key" ON "PatientRanking"("patientId", "portal");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlert_patientId_acknowledged_createdAt_idx" ON "MedicationSafetyAlert"("patientId", "acknowledged", "createdAt");

-- CreateIndex
CREATE INDEX "MedicationSafetyAlert_severity_createdAt_idx" ON "MedicationSafetyAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "AiInsight_patientId_type_dismissed_idx" ON "AiInsight"("patientId", "type", "dismissed");

-- CreateIndex
CREATE INDEX "AiInsight_patientId_createdAt_idx" ON "AiInsight"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiTemplate_key_key" ON "AiTemplate"("key");

-- CreateIndex
CREATE INDEX "AiTemplate_key_active_idx" ON "AiTemplate"("key", "active");

-- CreateIndex
CREATE INDEX "AiTemplate_type_idx" ON "AiTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_key_key" ON "SubscriptionPlan"("key");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_key_active_idx" ON "SubscriptionPlan"("key", "active");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_tier_idx" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_key_key" ON "Organization"("key");

-- CreateIndex
CREATE INDEX "Organization_key_active_idx" ON "Organization"("key", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE INDEX "UsageMeter_orgId_resetAt_idx" ON "UsageMeter"("orgId", "resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsageMeter_orgId_metric_period_key" ON "UsageMeter"("orgId", "metric", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_orgId_active_idx" ON "ApiKey"("orgId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_stripeInvoiceId_key" ON "SubscriptionInvoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_orgId_status_idx" ON "SubscriptionInvoice"("orgId", "status");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_dueAt_idx" ON "SubscriptionInvoice"("dueAt");

-- CreateIndex
CREATE INDEX "TrialRecord_orgId_idx" ON "TrialRecord"("orgId");

-- CreateIndex
CREATE INDEX "PatientVitalSigns_patientId_type_recordedAt_idx" ON "PatientVitalSigns"("patientId", "type", "recordedAt");

-- CreateIndex
CREATE INDEX "PatientVitalSigns_patientId_recordedAt_idx" ON "PatientVitalSigns"("patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "PatientVitalSigns_isAnomalous_recordedAt_idx" ON "PatientVitalSigns"("isAnomalous", "recordedAt");

-- CreateIndex
CREATE INDEX "PatientSymptomEntry_patientId_recordedAt_idx" ON "PatientSymptomEntry"("patientId", "recordedAt");

-- CreateIndex
CREATE INDEX "PatientSymptomEntry_patientId_severity_idx" ON "PatientSymptomEntry"("patientId", "severity");

-- CreateIndex
CREATE INDEX "PatientSymptomEntry_triggeredAlert_recordedAt_idx" ON "PatientSymptomEntry"("triggeredAlert", "recordedAt");

-- CreateIndex
CREATE INDEX "MedicationAdherenceLog_patientId_createdAt_idx" ON "MedicationAdherenceLog"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicationAdherenceLog_patientId_status_idx" ON "MedicationAdherenceLog"("patientId", "status");

-- CreateIndex
CREATE INDEX "MedicationAdherenceLog_medication_createdAt_idx" ON "MedicationAdherenceLog"("medication", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WearableDevice_deviceId_key" ON "WearableDevice"("deviceId");

-- CreateIndex
CREATE INDEX "WearableDevice_patientId_isActive_idx" ON "WearableDevice"("patientId", "isActive");

-- CreateIndex
CREATE INDEX "WearableDevice_deviceId_idx" ON "WearableDevice"("deviceId");

-- CreateIndex
CREATE INDEX "WearableDataPoint_deviceId_recordedAt_idx" ON "WearableDataPoint"("deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "WearableDataPoint_patientId_dataType_recordedAt_idx" ON "WearableDataPoint"("patientId", "dataType", "recordedAt");

-- CreateIndex
CREATE INDEX "ClinicalAlert_patientId_acknowledged_createdAt_idx" ON "ClinicalAlert"("patientId", "acknowledged", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalAlert_severity_createdAt_idx" ON "ClinicalAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalAlert_alertType_createdAt_idx" ON "ClinicalAlert"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "LiveDataStreamEvent_patientId_createdAt_idx" ON "LiveDataStreamEvent"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveDataStreamEvent_eventType_createdAt_idx" ON "LiveDataStreamEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "LiveDataStreamEvent_processed_createdAt_idx" ON "LiveDataStreamEvent"("processed", "createdAt");

-- CreateIndex
CREATE INDEX "GpCommunication_patientId_status_createdAt_idx" ON "GpCommunication"("patientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GpCommunication_clinicianId_createdAt_idx" ON "GpCommunication"("clinicianId", "createdAt");

-- CreateIndex
CREATE INDEX "GpCommunication_communicationType_status_idx" ON "GpCommunication"("communicationType", "status");

-- CreateIndex
CREATE INDEX "GpCommunication_gpNhsNumber_idx" ON "GpCommunication"("gpNhsNumber");

-- CreateIndex
CREATE INDEX "GpRecordUpdate_patientId_status_createdAt_idx" ON "GpRecordUpdate"("patientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GpRecordUpdate_updateType_status_idx" ON "GpRecordUpdate"("updateType", "status");

-- CreateIndex
CREATE INDEX "GpRecordUpdate_gpNhsNumber_idx" ON "GpRecordUpdate"("gpNhsNumber");

-- CreateIndex
CREATE INDEX "GpRecordUpdate_requiresClinicianApproval_status_idx" ON "GpRecordUpdate"("requiresClinicianApproval", "status");

-- CreateIndex
CREATE INDEX "Hook_event_status_idx" ON "Hook"("event", "status");

-- CreateIndex
CREATE INDEX "Hook_createdById_createdAt_idx" ON "Hook"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "HookExecution_hookId_executedAt_idx" ON "HookExecution"("hookId", "executedAt");

-- CreateIndex
CREATE INDEX "HookExecution_event_status_idx" ON "HookExecution"("event", "status");

-- CreateIndex
CREATE INDEX "HookExecution_executedAt_idx" ON "HookExecution"("executedAt");

-- CreateIndex
CREATE INDEX "Rail_event_scope_isEnabled_idx" ON "Rail"("event", "scope", "isEnabled");

-- CreateIndex
CREATE INDEX "Rail_severity_action_idx" ON "Rail"("severity", "action");

-- CreateIndex
CREATE INDEX "RailViolation_railId_createdAt_idx" ON "RailViolation"("railId", "createdAt");

-- CreateIndex
CREATE INDEX "RailViolation_patientId_createdAt_idx" ON "RailViolation"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "RailViolation_resolved_createdAt_idx" ON "RailViolation"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceCoordination_module_status_idx" ON "ServiceCoordination"("module", "status");

-- CreateIndex
CREATE INDEX "ServiceCoordination_updatedAt_idx" ON "ServiceCoordination"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCoordination_module_serviceName_key" ON "ServiceCoordination"("module", "serviceName");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAssignment" ADD CONSTRAINT "PatientAssignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAssignment" ADD CONSTRAINT "PatientAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAssignment" ADD CONSTRAINT "PatientAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAssignment" ADD CONSTRAINT "PatientAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQueueItem" ADD CONSTRAINT "TeamQueueItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQueueItem" ADD CONSTRAINT "TeamQueueItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamQueueItem" ADD CONSTRAINT "TeamQueueItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverArrangement" ADD CONSTRAINT "CoverArrangement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverArrangement" ADD CONSTRAINT "CoverArrangement_patientAssignmentId_fkey" FOREIGN KEY ("patientAssignmentId") REFERENCES "PatientAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverArrangement" ADD CONSTRAINT "CoverArrangement_originalUserId_fkey" FOREIGN KEY ("originalUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverArrangement" ADD CONSTRAINT "CoverArrangement_coveringUserId_fkey" FOREIGN KEY ("coveringUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaFactor" ADD CONSTRAINT "MfaFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_refreshTokenId_fkey" FOREIGN KEY ("refreshTokenId") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaChallenge" ADD CONSTRAINT "MfaChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAlert" ADD CONSTRAINT "SecurityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientContact" ADD CONSTRAINT "PatientContact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clinician" ADD CONSTRAINT "Clinician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusEvent" ADD CONSTRAINT "AppointmentStatusEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSession" ADD CONSTRAINT "VideoSession_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSessionEvent" ADD CONSTRAINT "VideoSessionEvent_videoSessionId_fkey" FOREIGN KEY ("videoSessionId") REFERENCES "VideoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_videoSessionId_fkey" FOREIGN KEY ("videoSessionId") REFERENCES "VideoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingConsent" ADD CONSTRAINT "RecordingConsent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingConsent" ADD CONSTRAINT "RecordingConsent_videoSessionId_fkey" FOREIGN KEY ("videoSessionId") REFERENCES "VideoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentWorkflowEvent" ADD CONSTRAINT "AssessmentWorkflowEvent_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResponse" ADD CONSTRAINT "ScreeningResponse_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResponse" ADD CONSTRAINT "ScreeningResponse_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdhdAssessment" ADD CONSTRAINT "AdhdAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutismAssessment" ADD CONSTRAINT "AutismAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitrationPlan" ADD CONSTRAINT "TitrationPlan_adhdAssessmentId_fkey" FOREIGN KEY ("adhdAssessmentId") REFERENCES "AdhdAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitrationPlan" ADD CONSTRAINT "TitrationPlan_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitrationReview" ADD CONSTRAINT "TitrationReview_titrationPlanId_fkey" FOREIGN KEY ("titrationPlanId") REFERENCES "TitrationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationReview" ADD CONSTRAINT "MedicationReview_adhdAssessmentId_fkey" FOREIGN KEY ("adhdAssessmentId") REFERENCES "AdhdAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCareAgreement" ADD CONSTRAINT "SharedCareAgreement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCareAgreement" ADD CONSTRAINT "SharedCareAgreement_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCareAgreement" ADD CONSTRAINT "SharedCareAgreement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalHealthReview" ADD CONSTRAINT "PhysicalHealthReview_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalHealthReview" ADD CONSTRAINT "PhysicalHealthReview_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalHealthAlert" ADD CONSTRAINT "PhysicalHealthAlert_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "PhysicalHealthReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNoteVersion" ADD CONSTRAINT "ClinicalNoteVersion_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ClinicalNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNoteVersion" ADD CONSTRAINT "ClinicalNoteVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ClinicalNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAccessLog" ADD CONSTRAINT "DocumentAccessLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionStatusEvent" ADD CONSTRAINT "PrescriptionStatusEvent_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierShipment" ADD CONSTRAINT "CourierShipment_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierShipment" ADD CONSTRAINT "CourierShipment_proofDocumentId_fkey" FOREIGN KEY ("proofDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierEvent" ADD CONSTRAINT "CourierEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "CourierShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_videoSessionId_fkey" FOREIGN KEY ("videoSessionId") REFERENCES "VideoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSummary" ADD CONSTRAINT "AiSummary_aiSessionId_fkey" FOREIGN KEY ("aiSessionId") REFERENCES "AiSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExtraction" ADD CONSTRAINT "AiExtraction_aiSessionId_fkey" FOREIGN KEY ("aiSessionId") REFERENCES "AiSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTranscript" ADD CONSTRAINT "AiTranscript_aiSessionId_fkey" FOREIGN KEY ("aiSessionId") REFERENCES "AiSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTranscriptSegment" ADD CONSTRAINT "AiTranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "AiTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_aiSessionId_fkey" FOREIGN KEY ("aiSessionId") REFERENCES "AiSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedDocument" ADD CONSTRAINT "AiGeneratedDocument_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedDocument" ADD CONSTRAINT "AiGeneratedDocument_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ClinicalNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedDocument" ADD CONSTRAINT "AiGeneratedDocument_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGeneratedDocument" ADD CONSTRAINT "AiGeneratedDocument_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "AiRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplateVersion" ADD CONSTRAINT "ReportTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_aiOutputId_fkey" FOREIGN KEY ("aiOutputId") REFERENCES "AiOutput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiOutput" ADD CONSTRAINT "AiOutput_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAuditEvent" ADD CONSTRAINT "ReportAuditEvent_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAuditEvent" ADD CONSTRAINT "ReportAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSignature" ADD CONSTRAINT "ReportSignature_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSignature" ADD CONSTRAINT "ReportSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSignature" ADD CONSTRAINT "ReportSignature_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAccess" ADD CONSTRAINT "ReportAccess_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAccess" ADD CONSTRAINT "ReportAccess_accessedById_fkey" FOREIGN KEY ("accessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAccess" ADD CONSTRAINT "ReportAccess_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportNextStep" ADD CONSTRAINT "ReportNextStep_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportNextStep" ADD CONSTRAINT "ReportNextStep_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportNextStep" ADD CONSTRAINT "ReportNextStep_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportNextStep" ADD CONSTRAINT "ReportNextStep_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessageSuggestion" ADD CONSTRAINT "AiMessageSuggestion_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicianEarning" ADD CONSTRAINT "ClinicianEarning_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlanInstallment" ADD CONSTRAINT "PaymentPlanInstallment_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTask" ADD CONSTRAINT "ClinicalTask_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTask" ADD CONSTRAINT "ClinicalTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintEvent" ADD CONSTRAINT "ComplaintEvent_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalFormDefinition" ADD CONSTRAINT "ClinicalFormDefinition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalFormSubmission" ADD CONSTRAINT "ClinicalFormSubmission_formDefinitionId_fkey" FOREIGN KEY ("formDefinitionId") REFERENCES "ClinicalFormDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalFormSubmission" ADD CONSTRAINT "ClinicalFormSubmission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalFormSubmission" ADD CONSTRAINT "ClinicalFormSubmission_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalRiskScore" ADD CONSTRAINT "ClinicalRiskScore_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalRiskScore" ADD CONSTRAINT "ClinicalRiskScore_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRanking" ADD CONSTRAINT "PatientRanking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRanking" ADD CONSTRAINT "PatientRanking_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSafetyAlert" ADD CONSTRAINT "MedicationSafetyAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSafetyAlert" ADD CONSTRAINT "MedicationSafetyAlert_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSafetyAlert" ADD CONSTRAINT "MedicationSafetyAlert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_sourceRunId_fkey" FOREIGN KEY ("sourceRunId") REFERENCES "AiRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTemplate" ADD CONSTRAINT "AiTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMeter" ADD CONSTRAINT "UsageMeter_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialRecord" ADD CONSTRAINT "TrialRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientVitalSigns" ADD CONSTRAINT "PatientVitalSigns_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSymptomEntry" ADD CONSTRAINT "PatientSymptomEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdherenceLog" ADD CONSTRAINT "MedicationAdherenceLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableDevice" ADD CONSTRAINT "WearableDevice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableDataPoint" ADD CONSTRAINT "WearableDataPoint_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "WearableDevice"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableDataPoint" ADD CONSTRAINT "WearableDataPoint_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAlert" ADD CONSTRAINT "ClinicalAlert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAlert" ADD CONSTRAINT "ClinicalAlert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveDataStreamEvent" ADD CONSTRAINT "LiveDataStreamEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpCommunication" ADD CONSTRAINT "GpCommunication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpCommunication" ADD CONSTRAINT "GpCommunication_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpCommunication" ADD CONSTRAINT "GpCommunication_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpCommunication" ADD CONSTRAINT "GpCommunication_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpCommunication" ADD CONSTRAINT "GpCommunication_sharedCareAgreementId_fkey" FOREIGN KEY ("sharedCareAgreementId") REFERENCES "SharedCareAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpRecordUpdate" ADD CONSTRAINT "GpRecordUpdate_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpRecordUpdate" ADD CONSTRAINT "GpRecordUpdate_gpCommunicationId_fkey" FOREIGN KEY ("gpCommunicationId") REFERENCES "GpCommunication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpRecordUpdate" ADD CONSTRAINT "GpRecordUpdate_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpRecordUpdate" ADD CONSTRAINT "GpRecordUpdate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hook" ADD CONSTRAINT "Hook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HookExecution" ADD CONSTRAINT "HookExecution_hookId_fkey" FOREIGN KEY ("hookId") REFERENCES "Hook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rail" ADD CONSTRAINT "Rail_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailViolation" ADD CONSTRAINT "RailViolation_railId_fkey" FOREIGN KEY ("railId") REFERENCES "Rail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailViolation" ADD CONSTRAINT "RailViolation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailViolation" ADD CONSTRAINT "RailViolation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RailViolation" ADD CONSTRAINT "RailViolation_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

