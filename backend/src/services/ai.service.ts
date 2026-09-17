import { config } from '../shared/config.js';

export type AiDraft = { title: string; content: string; model: string; disclaimer: string };

export class AiService {
  async draftClinicalReport(input: { assessmentType: string; clinicalFacts: string; recommendations?: string }) : Promise<AiDraft> {
    if (!config.OPENAI_API_KEY) return { title: `${input.assessmentType} assessment draft`, content: input.clinicalFacts, model: 'human-review-required', disclaimer: 'Draft generated without an AI provider. A registered clinician must review and approve this document.' };
    return { title: `${input.assessmentType} assessment draft`, content: input.clinicalFacts, model: 'openai-adapter-pending', disclaimer: 'AI-assisted draft. A registered clinician must review and approve this document.' };
  }

  async summarise(text: string) { return { summary: text.slice(0, 2000), model: config.OPENAI_API_KEY ? 'openai-adapter-pending' : 'deterministic-fallback', requiresReview: true }; }
}
