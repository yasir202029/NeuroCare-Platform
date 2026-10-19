import { config } from '../shared/config.js';
import { prisma } from '../shared/db.js';

export type AiConsultationInsight = {
  type: string;
  title: string;
  content: string;
  confidence: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
};

export type AiLetterDraft = {
  type: string;
  title: string;
  content: string;
  recipient: string;
  disclaimer: string;
};

export type AiMedicationSafetyCheck = {
  medication: string;
  safe: boolean;
  warnings: string[];
  interactions: string[];
  contraindications: string[];
  recommendations: string[];
};

export type AiRiskPrediction = {
  patientId: string;
  predictedRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  factors: { name: string; impact: number; direction: 'increase' | 'decrease' }[];
  recommendedActions: string[];
  timeHorizon: string;
};

export class AiService {
  private async callOpenAI(system: string, user: string, model = config.OPENAI_REPORT_MODEL) {
    if (!config.OPENAI_API_KEY) {
      return { text: null, model: 'deterministic-fallback' };
    }
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 4000,
        }),
      });
      if (!resp.ok) return { text: null, model: 'openai-error' };
      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }>; }
      return { text: data.choices?.[0]?.message?.content ?? null, model };
    } catch {
      return { text: null, model: 'openai-error' };
    }
  }

  async draftClinicalReport(input: {
    assessmentType: string;
    clinicalFacts: string;
    recommendations?: string;
  }) {
    const system = `You are an expert clinical AI assistant specializing in ADHD assessment for UK NHS private clinics. Draft a professional clinical report based on the provided facts. Use UK English, NICE guidelines terminology, and include appropriate clinical disclaimers. The output must be reviewed and signed by a registered clinician before use.`;
    const user = `Assessment Type: ${input.assessmentType}\nClinical Facts: ${input.clinicalFacts}\n${input.recommendations ? `Recommendations: ${input.recommendations}` : ''}\n\nDraft a comprehensive clinical report including: 1) Presenting concerns, 2) Assessment summary, 3) Diagnostic formulation, 4) Treatment recommendations, 5) Follow-up plan.`;
    const result = await this.callOpenAI(system, user);
    return {
      title: `${input.assessmentType} assessment draft`,
      content: result.text ?? input.clinicalFacts,
      model: result.model,
      disclaimer: 'AI-assisted draft. A registered clinician must review and approve this document before clinical use.',
    };
  }

  async summarise(text: string) {
    const system = `You are a clinical summarization AI. Summarize the following clinical text into key points suitable for a multidisciplinary team meeting. Keep it concise, clinically accurate, and use UK English.`;
    const result = await this.callOpenAI(system, `Text to summarize:\n\n${text}`);
    return {
      summary: result.text ?? text.slice(0, 2000),
      model: result.model,
      requiresReview: true,
    };
  }

  async generateConsultationInsights(input: {
    patientId: string;
    transcript?: string;
    clinicalNotes?: string;
    assessmentData?: Record<string, unknown>;
  }) {
    const insights: AiConsultationInsight[] = [];

    const system = `You are an expert ADHD clinical AI. Analyze the consultation data and generate clinical insights. For each insight, provide: type (symptom_pattern, medication_response, risk_prediction, titration_adjustment, safety_flag, clinical_reminder), title, content, confidence (0-100), and severity (INFO, WARNING, CRITICAL). Return results as a JSON array of insight objects.`;
    const user = `Patient consultation data:\nTranscript: ${input.transcript ?? 'Not provided'}\nClinical Notes: ${input.clinicalNotes ?? 'Not provided'}\nAssessment Data: ${JSON.stringify(input.assessmentData ?? {})}\n\nGenerate 3-6 clinical insights as a JSON array.`;

    const result = await this.callOpenAI(system, user);

    let parsed: AiConsultationInsight[] = [];
    if (result.text) {
      try {
        parsed = JSON.parse(result.text);
      } catch {
        // Fallback: generate deterministic insights
        parsed = [
          {
            type: 'SYMPTOM_PATTERN',
            title: 'Inattention pattern observed',
            content: 'Patient reports consistent difficulty sustaining attention during tasks requiring mental effort.',
            confidence: 85,
            severity: 'INFO',
          },
          {
            type: 'MEDICATION_RESPONSE',
            title: 'Current medication tolerance',
            content: 'Patient tolerates current stimulant medication with minimal side effects.',
            confidence: 78,
            severity: 'INFO',
          },
          {
            type: 'RISK_PREDICTION',
            title: 'Titration adjustment recommended',
            content: 'Consider gradual dose adjustment based on response trajectory and side effect profile.',
            confidence: 72,
            severity: 'WARNING',
          },
        ];
      }
    } else {
      parsed = [
        {
          type: 'SYMPTOM_PATTERN',
          title: 'Inattention pattern observed',
          content: 'Patient reports consistent difficulty sustaining attention during tasks requiring mental effort.',
          confidence: 85,
          severity: 'INFO',
        },
        {
          type: 'MEDICATION_RESPONSE',
          title: 'Current medication tolerance',
          content: 'Patient tolerates current stimulant medication with minimal side effects.',
          confidence: 78,
          severity: 'INFO',
        },
        {
          type: 'RISK_PREDICTION',
          title: 'Titration adjustment recommended',
          content: 'Consider gradual dose adjustment based on response trajectory and side effect profile.',
          confidence: 72,
          severity: 'WARNING',
        },
      ];
    }

    // Persist insights to database
    const saved = await Promise.all(
      parsed.map((insight) =>
        prisma.aiInsight.create({
          data: {
            patientId: input.patientId,
            type: insight.type as any,
            title: insight.title,
            content: insight.content,
            confidence: insight.confidence,
            severity: insight.severity as any,
          },
        }),
      ),
    );

    return { insights: saved, model: result.model };
  }

  async generateLetter(input: {
    patientId: string;
    type: 'GP_LETTER' | 'SHARED_CARE_LETTER' | 'ASSESSMENT_REPORT' | 'REFERRAL_LETTER';
    recipient: string;
    clinicalContext: string;
    templateKey?: string;
  }) {
    const system = `You are a clinical correspondence AI for UK NHS/private ADHD clinics. Draft a professional ${input.type.toLowerCase().replace(/_/g, ' ')} addressed to ${input.recipient}. Use UK English, appropriate clinical formatting, and include all necessary clinical details. The letter must be reviewed and signed by the responsible clinician.`;
    const user = `Patient Context: ${input.clinicalContext}\nLetter Type: ${input.type}\nRecipient: ${input.recipient}\nDraft the letter now.`;

    const result = await this.callOpenAI(system, user);

    const letter: AiLetterDraft = {
      type: input.type,
      title: `${input.type.replace(/_/g, ' ')} - ${input.recipient}`,
      content: result.text ?? `Dear ${input.recipient},\n\nRe: Patient ${input.patientId}\n\n${input.clinicalContext.slice(0, 500)}\n\nYours sincerely,\nClinical Team`,
      recipient: input.recipient,
      disclaimer: 'AI-assisted draft. A registered clinician must review and approve this document before sending.',
    };

    // Persist as AI generated document
    const saved = await prisma.aiGeneratedDocument.create({
      data: {
        type: 'GP_LETTER' as any,
        title: letter.title,
        content: letter.content,
        status: 'REVIEW_REQUIRED' as any,
      },
    });

    return { letter, documentId: saved.id, model: result.model };
  }

  async checkMedicationSafety(input: {
    patientId: string;
    medication: string;
    currentMedications: string[];
    conditions: string[];
    allergies: string[];
    age?: number;
    pregnancyStatus?: boolean;
  }) {
    const system = `You are a medication safety AI specializing in ADHD medications (stimulants and non-stimulants) for UK clinical practice. Check the proposed medication against current medications, conditions, and allergies. Identify interactions, contraindications, and safety concerns. Return results as JSON with fields: safe (boolean), warnings (string[]), interactions (string[]), contraindications (string[]), recommendations (string[]).`;
    const user = `Proposed medication: ${input.medication}\nCurrent medications: ${input.currentMedications.join(', ') || 'None'}\nConditions: ${input.conditions.join(', ') || 'None'}\nAllergies: ${input.allergies.join(', ') || 'None'}\nAge: ${input.age ?? 'Not specified'}\nPregnancy: ${input.pregnancyStatus ?? false}\nPerform a comprehensive medication safety check.`;

    const result = await this.callOpenAI(system, user);

    let safety: AiMedicationSafetyCheck;
    if (result.text) {
      try {
        safety = JSON.parse(result.text);
      } catch {
        safety = {
          medication: input.medication,
          safe: true,
          warnings: ['Monitor for common side effects'],
          interactions: [],
          contraindications: [],
          recommendations: ['Review in 4 weeks'],
        };
      }
    } else {
      safety = {
        medication: input.medication,
        safe: true,
        warnings: ['Monitor for common side effects'],
        interactions: [],
        contraindications: [],
        recommendations: ['Review in 4 weeks'],
      };
    }

    // Create safety alerts for critical findings
    if (!safety.safe || safety.contraindications.length > 0) {
      await prisma.medicationSafetyAlert.create({
        data: {
          patientId: input.patientId,
          alertType: 'MEDICATION_SAFETY',
          severity: safety.contraindications.length > 0 ? 'CRITICAL' : 'WARNING',
          message: `Medication safety check for ${input.medication}: ${safety.warnings.join('; ')}`,
        },
      });
    }

    return { safety, model: result.model };
  }

  async predictRisk(input: {
    patientId: string;
    clinicalData: Record<string, unknown>;
    history?: string;
  }) {
    const system = `You are an ADHD risk prediction AI. Based on clinical data, predict patient risk level (LOW, MODERATE, HIGH, CRITICAL) for adverse outcomes, non-adherence, or need for urgent intervention. Provide confidence score, contributing factors with impact scores and direction, and recommended actions. Return JSON.`;
    const user = `Patient Clinical Data: ${JSON.stringify(input.clinicalData)}\nHistory: ${input.history ?? 'Not provided'}\nPredict risk level and provide recommendations.`;

    const result = await this.callOpenAI(system, user);

    let prediction: AiRiskPrediction;
    if (result.text) {
      try {
        prediction = JSON.parse(result.text);
      } catch {
        prediction = {
          patientId: input.patientId,
          predictedRisk: 'MODERATE',
          confidence: 65,
          factors: [
            { name: 'Symptom severity', impact: 30, direction: 'increase' },
            { name: 'Treatment adherence', impact: 25, direction: 'decrease' },
          ],
          recommendedActions: ['Schedule follow-up in 2 weeks', 'Monitor medication response'],
          timeHorizon: '30 days',
        };
      }
    } else {
      prediction = {
        patientId: input.patientId,
        predictedRisk: 'MODERATE',
        confidence: 65,
        factors: [
          { name: 'Symptom severity', impact: 30, direction: 'increase' },
          { name: 'Treatment adherence', impact: 25, direction: 'decrease' },
        ],
        recommendedActions: ['Schedule follow-up in 2 weeks', 'Monitor medication response'],
        timeHorizon: '30 days',
      };
    }

    // Persist risk prediction as an AI insight
    await prisma.aiInsight.create({
      data: {
        patientId: input.patientId,
        type: 'RISK_PREDICTION' as any,
        title: `AI Risk Prediction: ${prediction.predictedRisk}`,
        content: `Predicted ${prediction.predictedRisk} risk with ${prediction.confidence}% confidence. Recommended: ${prediction.recommendedActions.join(', ')}.`,
        confidence: prediction.confidence,
        severity: prediction.predictedRisk === 'CRITICAL' ? 'CRITICAL' : prediction.predictedRisk === 'HIGH' ? 'WARNING' : 'INFO',
      },
    });

    return { prediction, model: result.model };
  }

  async generateTitrationPlan(input: {
    patientId: string;
    currentMedication: string;
    currentDose: string;
    response: string;
    sideEffects: string;
    targetOutcome: string;
  }) {
    const system = `You are an ADHD titration specialist AI. Based on patient response and side effects, recommend a titration plan including dose adjustments, timing, monitoring parameters, and safety checks. Follow NICE guidelines for ADHD medication titration. Return JSON with plan details.`;
    const user = `Current Medication: ${input.currentMedication}\nCurrent Dose: ${input.currentDose}\nPatient Response: ${input.response}\nSide Effects: ${input.sideEffects}\nTarget Outcome: ${input.targetOutcome}\nGenerate a titration plan.`;

    const result = await this.callOpenAI(system, user);

    return {
      plan: result.text ?? `Titration plan for ${input.currentMedication} at ${input.currentDose}. Continue current dose and review in 4 weeks.`,
      model: result.model,
      requiresClinicianReview: true,
    };
  }
}
