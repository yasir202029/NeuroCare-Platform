/**
 * Public marketing content model.
 *
 * Every public page declares its own metadata here so that:
 * - titles and descriptions are unique and centrally reviewable
 * - canonical URLs are derived from one source of truth (SITE_URL)
 * - structured data is generated from the same objects the page renders
 *
 * No claim may be published that the organisation does not actually make.
 * The validator in python-services/content-validator enforces these rules.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://neurocare.example.com";
export const SITE_NAME = "NeuroCare";
export const ORG_LEGAL_NAME = "NeuroCare";
export const ORG_DESCRIPTION =
  "Remote ADHD assessment and treatment pathway for adults and young people, delivered by a remote clinical team.";

export type PageMeta = {
  title: string;
  description: string;
  path: string;
  /** Question-and-answer pairs, rendered visibly and mirrored into FAQPage JSON-LD. */
  faq?: Array<{ question: string; answer: string }>;
};

export const publicPages: PageMeta[] = [
  {
    title: "Remote ADHD assessment and treatment | NeuroCare",
    description:
      "A remote ADHD pathway covering referral, assessment, clinical review, medication titration and ongoing monitoring, delivered by a remote clinical team.",
    path: "/",
    faq: [
      {
        question: "How does the remote ADHD pathway work?",
        answer:
          "You complete registration and consent, share your GP details, book an assessment, complete questionnaires, and upload any supporting evidence. A clinician then conducts the assessment and reviews the results before discussing diagnosis and treatment.",
      },
      {
        question: "What information do I need before an assessment?",
        answer:
          "You will need personal and contact details, your GP practice details, consent to process your information, and completed questionnaires. Any supporting evidence, such as school reports or previous assessments, can be uploaded through your portal.",
      },
      {
        question: "Can I receive medication through the service?",
        answer:
          "Where clinically appropriate and following a completed assessment, a prescriber reviews the record and decides whether medication should be started. Prescribing decisions are always made by an authorised prescriber, never automatically.",
      },
      {
        question: "Do I need to be in the UK?",
        answer:
          "The service is built around UK clinical pathways, UK GDPR obligations and UK prescribing practice, so it is intended for people receiving care in the UK.",
      },
    ],
  },
  {
    title: "ADHD assessment | NeuroCare",
    description:
      "What a remote ADHD assessment involves: referral review, questionnaires, clinical interview, differential reasoning, formulation and a written outcome.",
    path: "/adhd-assessment",
    faq: [
      {
        question: "What happens during an ADHD assessment?",
        answer:
          "A clinician reviews your referral, questionnaires and any evidence you have uploaded, then conducts a structured clinical interview covering developmental history, symptoms across settings, impairment, and relevant physical and psychiatric history.",
      },
      {
        question: "Will I receive a written outcome?",
        answer:
          "Yes. A written outcome is prepared by the clinician who assessed you and retained in your portal for you to read.",
      },
    ],
  },
  {
    title: "ADHD treatment and medication titration | NeuroCare",
    description:
      "What happens after an assessment: treatment planning, medication titration with monitored reviews, and ongoing clinical review.",
    path: "/adhd-treatment",
    faq: [
      {
        question: "What is medication titration?",
        answer:
          "Titration is the process of starting a medicine at an initial dose, reviewing the response and side effects, and adjusting the dose over a series of agreed reviews until a stable dose is reached or the medication is changed or stopped.",
      },
      {
        question: "What monitoring is required during titration?",
        answer:
          "Reviews capture response, side effects and physical observations such as blood pressure, pulse and weight. You will be asked to complete the observations and information your clinician requests between reviews.",
      },
    ],
  },
  {
    title: "How the pathway works | NeuroCare",
    description:
      "A step-by-step description of the NeuroCare ADHD pathway, from registration through assessment, treatment and ongoing review.",
    path: "/how-it-works",
  },
  {
    title: "Am I eligible for remote ADHD assessment? | NeuroCare",
    description:
      "Who remote ADHD assessment is suitable for, what is excluded, and what to check before starting.",
    path: "/eligibility",
  },
  {
    title: "Pricing and payment | NeuroCare",
    description:
      "How assessment and treatment are charged, when payment is taken, and what is included.",
    path: "/pricing",
  },
  {
    title: "Frequently asked questions | NeuroCare",
    description:
      "Answers to common questions about the remote ADHD pathway, consent, records, appointments and treatment.",
    path: "/faq",
  },
  {
    title: "Contact the NeuroCare team",
    description:
      "How to contact NeuroCare about the ADHD pathway, existing assessments, or support with an appointment.",
    path: "/contact",
  },
  {
    title: "Privacy notice | NeuroCare",
    description:
      "How NeuroCare processes personal data, the lawful bases used, retention periods, and how to exercise your UK data-protection rights.",
    path: "/privacy",
  },
  {
    title: "Accessibility statement | NeuroCare",
    description:
      "The accessibility approach for the NeuroCare website and patient portal, including known limitations and how to report a barrier.",
    path: "/accessibility",
  },
  {
    title: "Terms of use | NeuroCare",
    description:
      "The terms that apply to use of the NeuroCare website and patient portal.",
    path: "/terms",
  },
];

export function pageByPath(path: string): PageMeta | undefined {
  return publicPages.find((p) => p.path === path);
}

export function canonical(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
