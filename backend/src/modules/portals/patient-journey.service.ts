import { prisma } from '../../shared/db.js';

export type NextActionType =
  | 'COMPLETE_ONBOARDING'
  | 'COMPLETE_CONSENT'
  | 'PAY_INVOICE'
  | 'BOOK_APPOINTMENT'
  | 'COMPLETE_QUESTIONNAIRE'
  | 'INVITE_INFORMANT'
  | 'UPLOAD_EVIDENCE'
  | 'PREPARE_FOR_ASSESSMENT'
  | 'SUBMIT_OBSERVATIONS'
  | 'REVIEW_APPROVED_DOCUMENT'
  | 'AWAIT_CLINICAL_OUTCOME'
  | 'CONTINUE_TREATMENT'
  | 'NOTHING_OUTSTANDING';

export type PatientNextAction = {
  type: NextActionType;
  title: string;
  description: string;
  actionUrl: string;
  blocking: boolean;
};

export type PatientJourneyProjection = {
  currentStage: string;
  patientVisibleStatus: string;
  nextAction: PatientNextAction;
  secondaryActions: PatientNextAction[];
  milestones: Array<{ key: string; label: string; state: 'DONE' | 'CURRENT' | 'PENDING' | 'BLOCKED' }>;
  upcoming: Array<{ id: string; type: string; mode: string; startsAt: string; status: string }>;
  outstanding: Array<{ id: string; title: string; type: string; dueAt: string | null }>;
  outstandingQuestionnaires: Array<{ submissionId: string; name: string; status: string }>;
  outstandingDocumentRequests: Array<{ id: string; title: string; description: string | null; dueAt: string | null; status: string }>;
  recentUpdates: Array<{ id: string; title: string; type: string; createdAt: string }>;
};

/**
 * Derives the patient's journey state from real domain records.
 * The backend/domain remains authoritative; this is a presentation projection.
 */
export class PatientJourneyService {
  async project(userId: string): Promise<PatientJourneyProjection> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        preferredContact: true,
        consentToContact: true,
        medicalHistory: true,
        organizationId: true,
      },
    });

    if (!patient) {
      return {
        currentStage: 'NOT_STARTED',
        patientVisibleStatus: 'We could not find your care record yet.',
        nextAction: {
          type: 'COMPLETE_ONBOARDING',
          title: 'Start your registration',
          description: 'Tell us a little about yourself so we can set up your care record.',
          actionUrl: '/onboarding',
          blocking: true,
        },
        secondaryActions: [],
        milestones: [{ key: 'register', label: 'Create your record', state: 'CURRENT' }],
        upcoming: [],
        outstanding: [],
        outstandingQuestionnaires: [],
        outstandingDocumentRequests: [],
        recentUpdates: [],
      };
    }

    const patientId = patient.id;
    const now = new Date();

    const [
      consents,
      appointments,
      questionnaires,
      invoices,
      reports,
      clinicalTasks,
      physicalReviews,
      titrationPlans,
      latestTransition,
      documentRequests,
    ] = await Promise.all([
      prisma.consentRecord.findMany({ where: { patientId }, orderBy: { recordedAt: 'desc' } }),
      prisma.appointment.findMany({
        where: { patientId },
        orderBy: { startsAt: 'asc' },
      }),
      prisma.clinicalFormSubmission.findMany({
        where: { patientId },
        select: { id: true, status: true, submittedAt: true, formDefinition: { select: { name: true } } },
      }),
      prisma.invoice.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
      prisma.report.findMany({
        where: { patientId, status: { in: ['APPROVED', 'SHARED'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.clinicalTask.findMany({
        where: { patientId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.physicalHealthReview.findMany({ where: { patientId }, select: { id: true } }),
      prisma.titrationPlan.findMany({ where: { adhdAssessment: { assessment: { patientId } } }, select: { id: true } }),
      prisma.workflowTransition.findFirst({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
      prisma.documentRequest.findMany({
        where: { patientId },
        select: { id: true, title: true, description: true, status: true, dueAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const upcomingAppointments = appointments
      .filter((a) => a.startsAt >= now && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
      .map((a) => ({
        id: a.id,
        type: a.type,
        mode: a.mode,
        startsAt: a.startsAt.toISOString(),
        status: a.status,
      }));

    const outstandingTasks = clinicalTasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    }));

    const recentUpdates = reports.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.kind,
      createdAt: r.createdAt.toISOString(),
    }));

    const milestones = buildMilestones({
      hasProfile: Boolean(patient.dateOfBirth && patient.address && patient.emergencyContact),
      hasConsent: consents.length > 0,
      hasBooked: appointments.some((a) => a.status !== 'CANCELLED'),
      hasQuestionnaire: questionnaires.some((q) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW' || q.status === 'REVIEWED'),
      hasAssessment: Boolean(latestTransition),
      hasTreatment: titrationPlans.length > 0 || physicalReviews.length > 0,
    });

    const { nextAction, secondaryActions } = deriveNextAction({
      milestones,
      consents,
      invoices,
      appointments,
      questionnaires,
      documentRequests,
      reports,
      clinicalTasks,
      upcomingAppointments,
      now,
    });

    const currentStage = deriveStage(milestones);
    const patientVisibleStatus = describeStage(currentStage, nextAction);

    return {
      currentStage,
      patientVisibleStatus,
      nextAction,
      secondaryActions,
      milestones,
      upcoming: upcomingAppointments,
      outstanding: outstandingTasks,
      outstandingQuestionnaires: questionnaires
        .filter((q) => q.status === 'DRAFT' || q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW')
        .map((q) => ({ submissionId: q.id, name: q.formDefinition.name, status: q.status })),
      outstandingDocumentRequests: documentRequests
        .filter((r) => r.status === 'PENDING' || r.status === 'REJECTED')
        .map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          dueAt: r.dueAt ? r.dueAt.toISOString() : null,
          status: r.status,
        })),
      recentUpdates,
    };
  }
}

type MilestoneState = 'DONE' | 'CURRENT' | 'PENDING' | 'BLOCKED';

function buildMilestones(input: {
  hasProfile: boolean;
  hasConsent: boolean;
  hasBooked: boolean;
  hasQuestionnaire: boolean;
  hasAssessment: boolean;
  hasTreatment: boolean;
}): Array<{ key: string; label: string; state: MilestoneState }> {
  const ordered = [
    { key: 'profile', label: 'Your details', done: input.hasProfile },
    { key: 'consent', label: 'Consent', done: input.hasConsent },
    { key: 'booking', label: 'Booked', done: input.hasBooked },
    { key: 'questionnaire', label: 'Questionnaires', done: input.hasQuestionnaire },
    { key: 'assessment', label: 'Assessment', done: input.hasAssessment },
    { key: 'treatment', label: 'Treatment', done: input.hasTreatment },
  ];

  let currentAssigned = false;
  return ordered.map((m) => {
    if (m.done) return { key: m.key, label: m.label, state: 'DONE' as MilestoneState };
    if (!currentAssigned) {
      currentAssigned = true;
      return { key: m.key, label: m.label, state: 'CURRENT' as MilestoneState };
    }
    return { key: m.key, label: m.label, state: 'PENDING' as MilestoneState };
  });
}

function deriveStage(milestones: Array<{ key: string; state: MilestoneState }>): string {
  const current = milestones.find((m) => m.state === 'CURRENT');
  if (current) return current.key.toUpperCase();
  const last = milestones[milestones.length - 1];
  return last && last.state === 'DONE' ? 'TREATMENT_COMPLETE' : 'NOT_STARTED';
}

function describeStage(stage: string, next: PatientNextAction): string {
  switch (stage) {
    case 'PROFILE':
      return 'We need a few more details from you.';
    case 'CONSENT':
      return 'Please review and record your consent.';
    case 'BOOKING':
      return 'Book your assessment when you are ready.';
    case 'QUESTIONNAIRE':
      return 'Complete your questionnaires before your assessment.';
    case 'ASSESSMENT':
      return 'Your assessment is booked.';
    case 'TREATMENT':
      return 'Your care plan is active.';
    default:
      return next.title;
  }
}

function deriveNextAction(input: {
  milestones: Array<{ key: string; state: MilestoneState }>;
  consents: Array<{ type: string; granted: boolean; version: string }>;
  invoices: Array<{ id: string; status: string; totalPence: number }>;
  appointments: Array<{ id: string; status: string; startsAt: Date; type: string }>;
  questionnaires: Array<{ id: string; status: string; submittedAt: Date | null; formDefinition: { name: string } }>;
  documentRequests: Array<{ id: string; title: string; description: string | null; status: string; dueAt: Date | null }>;
  reports: Array<{ id: string; title: string }>;
  clinicalTasks: Array<{ id: string; title: string; type: string }>;
  upcomingAppointments: Array<{ id: string; startsAt: string }>;
  now: Date;
}): { nextAction: PatientNextAction; secondaryActions: PatientNextAction[] } {
  const secondary: PatientNextAction[] = [];
  const currentKey = input.milestones.find((m) => m.state === 'CURRENT')?.key;

  const hasGrantedConsent = input.consents.some((c) => c.granted);
  const hasWithdrawnConsent = input.consents.some((c) => !c.granted);
  const unpaidInvoice = input.invoices.find((i) => i.status === 'OPEN' || i.status === 'OVERDUE');
  const hasBooked = input.appointments.some((a) => a.status !== 'CANCELLED');
  const submittedQuestionnaires = input.questionnaires.filter(
    (q) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW' || q.status === 'REVIEWED',
  );
  const draftQuestionnaire = input.questionnaires.find((q) => q.status === 'DRAFT');
  const hasQuestionnaire = submittedQuestionnaires.length > 0;
  const openTask = input.clinicalTasks[0];

  const pendingRequest = input.documentRequests.find((r) => r.status === 'PENDING');

  // An explicitly requested piece of evidence is the most actionable thing the
  // patient can do, so it outranks generic stage progression.
  if (pendingRequest) {
    return {
      nextAction: {
        type: 'UPLOAD_EVIDENCE',
        title: `Upload: ${pendingRequest.title}`,
        description:
          pendingRequest.description ??
          'Your clinician has asked for a document. Upload it so your assessment can continue.',
        actionUrl: '/patient/documents',
        blocking: true,
      },
      secondaryActions: secondary,
    };
  }

  // Work the patient has already started outranks any earlier stage, so that
  // a partially completed questionnaire is never hidden from them.
  if (draftQuestionnaire) {
    return {
      nextAction: {
        type: 'COMPLETE_QUESTIONNAIRE',
        title: `Continue "${draftQuestionnaire.formDefinition.name}"`,
        description: 'Your answers are saved. Finish and submit this questionnaire.',
        actionUrl: '/patient/questionnaires',
        blocking: true,
      },
      secondaryActions: secondary,
    };
  }

  if (hasWithdrawnConsent && !hasGrantedConsent) {
    return {
      nextAction: {
        type: 'COMPLETE_CONSENT',
        title: 'Give or withdraw consent',
        description: 'We need your consent decision before we can continue.',
        actionUrl: '/onboarding',
        blocking: true,
      },
      secondaryActions: [],
    };
  }

  if (currentKey === 'profile') {
    return {
      nextAction: {
        type: 'COMPLETE_ONBOARDING',
        title: 'Complete your details',
        description: 'Add your date of birth, address and emergency contact.',
        actionUrl: '/onboarding',
        blocking: true,
      },
      secondaryActions: [],
    };
  }

  if (currentKey === 'consent') {
    return {
      nextAction: {
        type: 'COMPLETE_CONSENT',
        title: 'Review and record your consent',
        description: 'Your consent choices are recorded in your care record.',
        actionUrl: '/onboarding',
        blocking: true,
      },
      secondaryActions: [],
    };
  }

  if (unpaidInvoice) {
    return {
      nextAction: {
        type: 'PAY_INVOICE',
        title: 'Payment is outstanding',
        description: 'There is an unpaid invoice on your account.',
        actionUrl: '/documents',
        blocking: true,
      },
      secondaryActions: secondary,
    };
  }

  if (currentKey === 'booking' && !hasBooked) {
    return {
      nextAction: {
        type: 'BOOK_APPOINTMENT',
        title: 'Book your assessment',
        description: 'Choose a time that works for you.',
        actionUrl: '/patient/book',
        blocking: true,
      },
      secondaryActions: secondary,
    };
  }

  if (openTask) {
    return {
      nextAction: {
        type: 'SUBMIT_OBSERVATIONS',
        title: openTask.title,
        description: 'Your care team has asked you to complete something.',
        actionUrl: '/patient',
        blocking: false,
      },
      secondaryActions: secondary,
    };
  }

  if (currentKey === 'questionnaire' && !hasQuestionnaire) {
    return {
      nextAction: {
        type: 'COMPLETE_QUESTIONNAIRE',
        title: 'Complete your questionnaire',
        description: 'This helps your clinician prepare for your appointment.',
        actionUrl: '/onboarding',
        blocking: true,
      },
      secondaryActions: secondary,
    };
  }

  if (hasBooked && !hasQuestionnaire) {
    secondary.push({
      type: 'COMPLETE_QUESTIONNAIRE',
      title: 'Complete your questionnaire',
      description: 'This helps your clinician prepare for your appointment.',
      actionUrl: '/onboarding',
      blocking: false,
    });
  }

  if (input.upcomingAppointments.length > 0) {
    const appt = input.upcomingAppointments[0];
    return {
      nextAction: {
        type: 'PREPARE_FOR_ASSESSMENT',
        title: 'Prepare for your upcoming appointment',
        description: 'Check what to bring and complete anything still outstanding.',
        actionUrl: '/patient/book',
        blocking: false,
      },
      secondaryActions: [
        ...secondary,
        {
          type: 'UPLOAD_EVIDENCE',
          title: 'Upload supporting evidence',
          description: 'Send any documents your clinician has requested.',
          actionUrl: '/documents',
          blocking: false,
        },
      ],
    };
  }

  if (input.reports.length > 0) {
    return {
      nextAction: {
        type: 'REVIEW_APPROVED_DOCUMENT',
        title: 'A new document is ready',
        description: 'Your clinician has approved a document for you.',
        actionUrl: '/documents',
        blocking: false,
      },
      secondaryActions: secondary,
    };
  }

  return {
    nextAction: {
      type: 'AWAIT_CLINICAL_OUTCOME',
      title: 'Nothing needs your attention right now',
      description: 'We will contact you when there is an update.',
      actionUrl: '/patient',
      blocking: false,
    },
    secondaryActions: secondary,
  };
}
