import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../shared/http.js';
import { Role } from '@prisma/client';
import { audit } from '../../middleware/audit.js';

const AI_URL = process.env.CLINICAL_AI_URL || 'http://clinical-ai:8001';
const TIMEOUT_MS = 15000;

const router = Router();
const clinicalRoles = [Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN];

async function proxy(path: string, method: string, body?: unknown, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(`${AI_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await r.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { status: r.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 502, data: { error: 'AI service unavailable', detail: message } };
  } finally {
    clearTimeout(timer);
  }
}

router.post('/draft-report', requireAuth, requireRole(...clinicalRoles), audit('AI_DRAFT_REPORT', 'ClinicalAI'), asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string(), sections: z.array(z.string()).optional() }).parse(req.body);
  const { status, data } = await proxy('/draft-report', 'POST', { patientId: body.patientId, clinicianId: (req as any).user?.id, sections: body.sections });
  res.status(status).json(data);
}));

router.post('/validate-prescription', requireAuth, requireRole(...clinicalRoles), audit('AI_VALIDATE_RX', 'ClinicalAI'), asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string(), medication: z.string(), dose: z.string(), isControlledDrug: z.boolean().optional(), indication: z.string().optional() }).parse(req.body);
  const { status, data } = await proxy('/validate-prescription', 'POST', { ...body, clinicianId: (req as any).user?.id });
  res.status(status).json(data);
}));

router.post('/summarise-note', requireAuth, requireRole(...clinicalRoles), audit('AI_SUMMARISE_NOTE', 'ClinicalAI'), asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string(), note: z.string(), type: z.string().optional() }).parse(req.body);
  const { status, data } = await proxy('/summarise-note', 'POST', { patientId: body.patientId, clinicianId: (req as any).user?.id, note: body.note, type: body.type });
  res.status(status).json(data);
}));

router.get('/pathway/:patientId', requireAuth, requireRole(...clinicalRoles), asyncHandler(async (req, res) => {
  const { status, data } = await proxy(`/pathway/${req.params.patientId}`, 'GET');
  res.status(status).json(data);
}));

export default router;
