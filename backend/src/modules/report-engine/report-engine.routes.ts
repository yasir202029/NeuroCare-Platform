import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requirePatientAccess } from '../../middleware/patient-authz.js';
import { asyncHandler } from '../../shared/http.js';
import { Role } from '@prisma/client';
import { audit } from '../../middleware/audit.js';

const REPORT_ENGINE_URL = process.env.REPORT_ENGINE_URL || 'http://report-engine:8000';
const TIMEOUT_MS = 15000;

const router = Router();
const clinicalRoles = [Role.PSYCHIATRIST, Role.PRESCRIBER, Role.NURSE, Role.ADMIN, Role.FINANCE];

async function proxy(path: string, method: string, body?: unknown, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(`${REPORT_ENGINE_URL}${path}`, {
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
    return { status: 502, data: { error: 'Report engine unavailable', detail: message } };
  } finally {
    clearTimeout(timer);
  }
}

router.post('/generate', requireAuth, requireRole(...clinicalRoles), requirePatientAccess('body'), audit('REPORT_GENERATE', 'ReportEngine'), asyncHandler(async (req, res) => {
  const body = z.object({ patientId: z.string(), type: z.string(), data: z.record(z.string(), z.unknown()).optional() }).parse(req.body);
  const { status, data } = await proxy('/generate', 'POST', body);
  res.status(status).json(data);
}));

router.get('/templates', requireAuth, asyncHandler(async (_req, res) => {
  const { status, data } = await proxy('/templates', 'GET');
  res.status(status).json(data);
}));

export default router;
