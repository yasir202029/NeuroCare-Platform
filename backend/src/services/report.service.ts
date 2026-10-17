import { AiRunStatus, AiRunType, AiTransformAction, ReportKind, ReportStatus } from '@prisma/client';
import { config } from '../shared/config.js';
import { prisma } from '../shared/db.js';
import { notFound } from '../shared/errors.js';

type GenerateInput = { patientId: string; assessmentId?: string; kind: ReportKind; title: string; sourceType: 'transcript' | 'notes' | 'text'; sourceText: string; templateId?: string };

const templates: Array<{ key: string; name: string; kind: ReportKind; description: string }> = [
  { key: 'adhd-initial-v1', name: 'ADHD initial assessment', kind: ReportKind.ADHD_INITIAL, description: 'Structured initial ADHD assessment report.' },
  { key: 'adhd-follow-up-v1', name: 'ADHD follow-up', kind: ReportKind.ADHD_FOLLOW_UP, description: 'Follow-up report for ongoing ADHD care.' },
  { key: 'adhd-titration-v1', name: 'ADHD titration', kind: ReportKind.ADHD_TITRATION, description: 'Medication titration review report.' },
  { key: 'adhd-shared-care-v1', name: 'ADHD shared care', kind: ReportKind.ADHD_SHARED_CARE, description: 'Shared care transfer letter and clinical summary.' },
  { key: 'adhd-discharge-v1', name: 'ADHD discharge', kind: ReportKind.ADHD_DISCHARGE, description: 'Discharge summary and recommendations.' },
  { key: 'autism-assessment-v1', name: 'Autism assessment', kind: ReportKind.AUTISM_ASSESSMENT, description: 'Comprehensive autism assessment report.' },
  { key: 'autism-developmental-v1', name: 'Developmental history', kind: ReportKind.AUTISM_DEVELOPMENTAL_HISTORY, description: 'Developmental history report.' },
  { key: 'autism-informant-v1', name: 'Informant report', kind: ReportKind.AUTISM_INFORMANT, description: 'Informant contribution report.' },
  { key: 'autism-diagnostic-v1', name: 'Autism diagnostic report', kind: ReportKind.AUTISM_DIAGNOSTIC, description: 'Diagnostic formulation and recommendations.' },
  { key: 'gp-letter-v1', name: 'GP letter', kind: ReportKind.GP_LETTER, description: 'Clinician-reviewed GP correspondence.' },
  { key: 'shared-care-letter-v1', name: 'Shared care letter', kind: ReportKind.SHARED_CARE_LETTER, description: 'Shared care communication.' },
  { key: 'school-letter-v1', name: 'School letter', kind: ReportKind.SCHOOL_LETTER, description: 'School support letter.' },
  { key: 'employer-letter-v1', name: 'Employer letter', kind: ReportKind.EMPLOYER_LETTER, description: 'Workplace support letter.' },
  { key: 'supporting-evidence-v1', name: 'Supporting evidence letter', kind: ReportKind.SUPPORTING_EVIDENCE_LETTER, description: 'Supporting evidence for reasonable adjustments.' },
];

export class ReportService {
  async listTemplates() {
    const existing = await prisma.reportTemplate.findMany({ where: { active: true }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } }, orderBy: { name: 'asc' } });
    if (existing.length) return existing;
    return Promise.all(templates.map((template) => prisma.reportTemplate.create({ data: { ...template, versions: { create: { version: 1, content: this.templateContent(template.kind), systemPrompt: 'Use only supplied clinical facts. Never invent evidence.', promptVersion: 'report-v1' } } } })));
  }

  async generate(input: GenerateInput, actorId: string) {
    const template = input.templateId ? await prisma.reportTemplate.findUnique({ where: { id: input.templateId } }) : await prisma.reportTemplate.findFirst({ where: { kind: input.kind, active: true } });
    const clinician = await prisma.clinician.findUnique({ where: { userId: actorId }, select: { id: true } });
    const report = await prisma.report.create({ data: { patientId: input.patientId, assessmentId: input.assessmentId, clinicianId: clinician?.id, templateId: template?.id, kind: input.kind, title: input.title, status: ReportStatus.REVIEW_REQUIRED } });
    const generated = await this.generateDraft(input.kind, input.sourceText);
    const output = await prisma.aiOutput.create({ data: { reportId: report.id, type: input.sourceType === 'transcript' ? AiRunType.REPORT_DRAFT : AiRunType.NOTE_DRAFT, action: AiTransformAction.GENERATE, model: generated.model, promptVersion: 'report-v1', inputSnapshot: { sourceType: input.sourceType, templateId: template?.id }, outputContent: generated.content, status: AiRunStatus.REVIEW_REQUIRED } });
    const version = await prisma.reportVersion.create({ data: { reportId: report.id, version: 1, content: generated.content, createdById: actorId, aiOutputId: output.id } });
    await prisma.reportAuditEvent.create({ data: { reportId: report.id, actorId, action: 'REPORT_GENERATED', metadata: { sourceType: input.sourceType, kind: input.kind } } });
    return { report: { ...report, currentVersion: version.version }, output, version, requiresReview: true };
  }

  async transform(reportId: string, action: AiTransformAction, actorId: string, tone?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } });
    if (!report) throw notFound('Report not found');
    const source = report.versions[0]?.content ?? '';
    const transformed = await this.transformContent(source, action, tone);
    const output = await prisma.aiOutput.create({ data: { reportId, type: AiRunType.REPORT_DRAFT, action, model: transformed.model, promptVersion: 'report-transform-v1', inputSnapshot: { sourceVersion: report.currentVersion, tone }, outputContent: transformed.content, status: AiRunStatus.REVIEW_REQUIRED } });
    const version = await prisma.reportVersion.create({ data: { reportId, version: report.currentVersion + 1, content: transformed.content, createdById: actorId, aiOutputId: output.id } });
    await prisma.report.update({ where: { id: reportId }, data: { currentVersion: version.version, status: ReportStatus.REVIEW_REQUIRED } });
    await prisma.reportAuditEvent.create({ data: { reportId, actorId, action: `REPORT_${action}`, metadata: { fromVersion: report.currentVersion, toVersion: version.version } } });
    return { output, version, requiresReview: true };
  }

  async get(reportId: string) { const report = await prisma.report.findUnique({ where: { id: reportId }, include: { template: { include: { versions: true } }, versions: { orderBy: { version: 'desc' } }, aiOutputs: { orderBy: { createdAt: 'desc' } }, auditEvents: { orderBy: { createdAt: 'desc' } } } }); if (!report) throw notFound('Report not found'); return report; }
  async compare(reportId: string, left: number, right: number) { const versions = await prisma.reportVersion.findMany({ where: { reportId, version: { in: [left, right] } }, orderBy: { version: 'asc' } }); return { left: versions.find((version) => version.version === left), right: versions.find((version) => version.version === right) }; }
  async approve(reportId: string, actorId: string) { const report = await prisma.report.update({ where: { id: reportId }, data: { status: ReportStatus.APPROVED }, include: { versions: { orderBy: { version: 'desc' }, take: 1 } } }); await prisma.reportAuditEvent.create({ data: { reportId, actorId, action: 'REPORT_APPROVED' } }); return report; }

  private templateContent(kind: ReportKind) { return `# ${kind}\n\n## Clinical context\n{{clinical_context}}\n\n## Findings\n{{findings}}\n\n## Formulation\n{{formulation}}\n\n## Recommendations\n{{recommendations}}`; }
  private async generateDraft(kind: ReportKind, source: string) {
    const fallback = `# ${kind.replaceAll('_', ' ')}\n\n## Source material\n${source}\n\n## Clinical review required\nThis AI-assisted draft must be reviewed, corrected, and approved by a registered clinician before sharing.`;
    const generated = await this.openAiText('Generate a structured clinical report draft. Use only supplied facts. Never invent diagnoses, medication, risk, or physical-health findings.', source);
    return generated ?? { content: fallback, model: 'human-review-required' };
  }

  private async transformContent(content: string, action: AiTransformAction, tone?: string) {
    const generated = await this.openAiText(`${action.replaceAll('_', ' ')} this clinician-authored draft. Preserve facts and do not add clinical claims.${tone ? ` Use a ${tone} tone.` : ''}`, content);
    if (generated) return generated;
    if (action === AiTransformAction.SHORTEN) return { content: content.split('\n').filter((line) => line.trim()).slice(0, 12).join('\n'), model: 'human-review-required' };
    if (action === AiTransformAction.EXPAND) return { content: `${content}\n\n## Additional clinical context\nAdd clinician-verified detail, supporting evidence, and practical recommendations here.`, model: 'human-review-required' };
    if (action === AiTransformAction.GP_FORMAT) return { content: `Dear GP,\n\n${content}\n\nKind regards,\nNeuroCare clinical team`, model: 'human-review-required' };
    if (action === AiTransformAction.PATIENT_FRIENDLY) return { content: `## Your report in plain language\n\n${content.replaceAll('Clinical review required', 'What happens next')}`, model: 'human-review-required' };
    if (action === AiTransformAction.IMPROVE_GRAMMAR) return { content: content.replace(/\s+/g, ' ').replaceAll('. ', '.\n\n'), model: 'human-review-required' };
    return { content: `## Revised draft${tone ? ` (${tone} tone)` : ''}\n\n${content}`, model: 'human-review-required' };
  }

  private async openAiText(system: string, input: string): Promise<{ content: string; model: string } | null> {
    if (!config.OPENAI_API_KEY) return null;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.OPENAI_REPORT_MODEL, temperature: 0.1, messages: [{ role: 'system', content: system }, { role: 'user', content: input }] }) });
      if (!response.ok) return null;
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content?.trim();
      return content ? { content, model: config.OPENAI_REPORT_MODEL } : null;
    } catch { return null; }
  }
}
