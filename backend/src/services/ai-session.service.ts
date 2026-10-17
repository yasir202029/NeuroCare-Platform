import { AiRunStatus, AiRunType } from '@prisma/client';
import { prisma } from '../shared/db.js';
import { config } from '../shared/config.js';

export class AiSessionService {
  async start(videoSessionId: string) {
    const videoSession = await prisma.videoSession.findUniqueOrThrow({ where: { id: videoSessionId } });
    const session = await prisma.aiSession.upsert({ where: { videoSessionId }, create: { videoSessionId, consented: true, startedAt: new Date() }, update: { consented: true, startedAt: new Date(), endedAt: null } });
    await prisma.aiRun.create({ data: { aiSessionId: session.id, type: AiRunType.TRANSCRIPTION, status: AiRunStatus.RUNNING, model: config.TRANSCRIPTION_PROVIDER, promptVersion: config.TRANSCRIPTION_LANGUAGE, startedAt: new Date() } });
    return { id: session.id, provider: config.TRANSCRIPTION_PROVIDER, language: config.TRANSCRIPTION_LANGUAGE, videoSessionId: videoSession.id };
  }

  async end(videoSessionId: string) {
    const session = await prisma.aiSession.findUniqueOrThrow({ where: { videoSessionId }, include: { transcript: { include: { segments: true } } } });
    const transcript = session.transcript?.segments.map((segment) => `${segment.speaker ?? 'Speaker'}: ${segment.content}`).join('\n') ?? 'No transcript segments were received. Complete the consultation note manually.';
    const now = new Date();
    const summary = await prisma.aiSummary.upsert({ where: { aiSessionId: session.id }, create: { aiSessionId: session.id, consultationNotes: transcript, followUpNotes: 'Review the consultation transcript and add clinician-approved follow-up actions.', draftReport: 'AI draft pending clinician review.' }, update: { consultationNotes: transcript, followUpNotes: 'Review the consultation transcript and add clinician-approved follow-up actions.', draftReport: 'AI draft pending clinician review.' } });
    const extraction = await prisma.aiExtraction.upsert({ where: { aiSessionId: session.id }, create: { aiSessionId: session.id, actionItems: [], riskFlags: [], diagnoses: [], medications: [], physicalHealth: [] }, update: { actionItems: [], riskFlags: [], diagnoses: [], medications: [], physicalHealth: [] } });
    await prisma.aiSession.update({ where: { id: session.id }, data: { endedAt: now } });
    await prisma.aiRun.create({ data: { aiSessionId: session.id, type: AiRunType.SUMMARY, status: AiRunStatus.REVIEW_REQUIRED, model: config.OPENAI_API_KEY ? 'openai' : 'human-review-required', output: { summaryId: summary.id, extractionId: extraction.id }, startedAt: now, completedAt: now } });
    return { sessionId: session.id, summary, extraction, requiresClinicianReview: true };
  }
}
