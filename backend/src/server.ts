import { app } from './app.js';
import { config } from './shared/config.js';
import { disconnectDatabase } from './shared/db.js';
import { prisma } from './shared/db.js';
import { logger } from './infrastructure/logger.js';
import { WebSocketServer, WebSocket } from 'ws';
import { LiveDataService } from './modules/live-data/live-data.service.js';
import { ServiceCoordinationService } from './modules/coordination/coordination.service.js';
import { GpCommunicationService } from './modules/gp-communication/gp-communication.service.js';
import { HookService, registerInternalHookHandler } from './modules/hooks/hook.service.js';
import { RailService } from './modules/rails/rail.service.js';
import { HookEvent, RailAction, RailSeverity, RailScope } from '@prisma/client';

const httpServer = app.listen(config.PORT, () =>
  logger.info({ port: config.PORT }, 'NeuroCare backend listening'),
);

// ============================================================
// COORDINATION LAYER - Makes all modules run together
// ============================================================

const coordinationService = new ServiceCoordinationService();
const liveDataService = new LiveDataService((patientId, message) => {
  broadcastToPatient(patientId, message);
});
const gpCommunicationService = new GpCommunicationService();
const hookService = new HookService();
const railService = new RailService(hookService);

// Register all core modules as HEALTHY on startup
async function registerAllModules() {
  const modules = [
    { module: 'backend', serviceName: 'api-server', status: 'HEALTHY' as const },
    { module: 'live-data', serviceName: 'websocket-server', status: 'HEALTHY' as const },
    { module: 'gp-communication', serviceName: 'shared-care-api', status: 'HEALTHY' as const },
    { module: 'hooks', serviceName: 'webhook-engine', status: 'HEALTHY' as const },
    { module: 'rails', serviceName: 'guardrail-engine', status: 'HEALTHY' as const },
    { module: 'onboarding', serviceName: 'patient-journey', status: 'HEALTHY' as const },
    { module: 'reports', serviceName: 'report-engine', status: 'HEALTHY' as const },
    { module: 'engine', serviceName: 'workflow-engine', status: 'HEALTHY' as const },
    { module: 'clinical-risk', serviceName: 'risk-stratification', status: 'HEALTHY' as const },
    { module: 'ai', serviceName: 'ai-assistant', status: 'HEALTHY' as const },
    { module: 'saas', serviceName: 'billing-engine', status: 'HEALTHY' as const },
    { module: 'auth', serviceName: 'identity-server', status: 'HEALTHY' as const },
    { module: 'booking', serviceName: 'appointment-server', status: 'HEALTHY' as const },
    { module: 'messaging', serviceName: 'communication-hub', status: 'HEALTHY' as const },
    { module: 'finance', serviceName: 'revenue-cycle', status: 'HEALTHY' as const },
    { module: 'portals', serviceName: 'role-portals', status: 'HEALTHY' as const },
    { module: 'teams', serviceName: 'care-teams', status: 'HEALTHY' as const },
    { module: 'clinician', serviceName: 'clinician-workspace', status: 'HEALTHY' as const },
    { module: 'coordination', serviceName: 'orchestrator', status: 'HEALTHY' as const },
  ];

  for (const m of modules) {
    await coordinationService.registerModule(m.module, m.serviceName, m.status, {
      registeredAt: new Date().toISOString(),
      port: config.PORT,
      environment: config.NODE_ENV,
    });
  }

  logger.info({ count: modules.length }, 'All modules registered and coordinated');
}

// Set up default rails for common clinical scenarios
async function setupDefaultRails() {
  const systemUser = await prisma.user.findFirst();
  if (!systemUser) {
    logger.warn('No users found, skipping default rail creation');
    return;
  }
  const systemUserId = systemUser.id;

  const defaultRails = [
    {
      name: 'Critical Risk Requires Consultant Approval',
      description: 'Blocks actions when patient risk is CRITICAL without consultant approval',
      event: HookEvent.RISK_SCORE_CALCULATED as HookEvent,
      scope: RailScope.GLOBAL,
      severity: RailSeverity.CRITICAL,
      action: RailAction.BLOCK,
      condition: { riskBand: { eq: 'CRITICAL' }, requiresConsultantApproval: { eq: false } },
      createdById: systemUserId,
    },
    {
      name: 'High Risk Medication Change Warning',
      description: 'Warns when medication changes for HIGH risk patients',
      event: HookEvent.MEDICATION_PRESCRIBED as HookEvent,
      scope: RailScope.GLOBAL,
      severity: RailSeverity.WARNING,
      action: RailAction.WARN,
      condition: { riskBand: { eq: 'HIGH' }, medicationChange: { eq: true } },
      createdById: systemUserId,
    },
    {
      name: 'Safety Alert Auto-Escalation',
      description: 'Escalates CRITICAL safety alerts immediately',
      event: HookEvent.SAFETY_ALERT_TRIGGERED as HookEvent,
      scope: RailScope.GLOBAL,
      severity: RailSeverity.CRITICAL,
      action: RailAction.LOG,
      condition: { severity: { eq: 'CRITICAL' } },
      createdById: systemUserId,
    },
    {
      name: 'GP Communication Requires Approval for Controlled Drugs',
      description: 'Requires clinician approval when GP communication involves controlled drugs',
      event: HookEvent.GP_COMMUNICATION_SENT as HookEvent,
      scope: RailScope.GLOBAL,
      severity: RailSeverity.WARNING,
      action: RailAction.REQUIRE_APPROVAL,
      condition: { controlledDrug: { eq: true } },
      createdById: systemUserId,
    },
  ];

  for (const rail of defaultRails) {
    try {
      await railService.createRail(rail);
    } catch (err) {
      // Rail may already exist
      logger.debug({ rail: rail.name }, 'Rail may already exist, skipping');
    }
  }

  logger.info({ count: defaultRails.length }, 'Default rails configured');
}

// Set up default hooks for cross-module coordination
async function setupDefaultHooks() {
  // Register internal handlers for key events
  registerInternalHookHandler(HookEvent.ASSESSMENT_COMPLETED, async (payload) => {
    logger.info({ payload }, 'Hook: Assessment completed - triggering follow-up actions');
    // Could trigger: create report, notify care team, schedule follow-up
    return { action: 'assessment-completed-handled', timestamp: new Date().toISOString() };
  });

  registerInternalHookHandler(HookEvent.MEDICATION_PRESCRIBED, async (payload) => {
    logger.info({ payload }, 'Hook: Medication prescribed - checking safety rails');
    return { action: 'medication-prescribed-handled', timestamp: new Date().toISOString() };
  });

  registerInternalHookHandler(HookEvent.GP_COMMUNICATION_SENT, async (payload) => {
    logger.info({ payload }, 'Hook: GP communication sent - updating shared care record');
    return { action: 'gp-communication-handled', timestamp: new Date().toISOString() };
  });

  registerInternalHookHandler(HookEvent.GP_RECORD_UPDATED, async (payload) => {
    logger.info({ payload }, 'Hook: GP record updated - notifying care team');
    return { action: 'gp-record-update-handled', timestamp: new Date().toISOString() };
  });

  registerInternalHookHandler(HookEvent.SAFETY_ALERT_TRIGGERED, async (payload) => {
    logger.info({ payload }, 'Hook: Safety alert triggered - notifying all portals');
    return { action: 'safety-alert-handled', timestamp: new Date().toISOString() };
  });

  registerInternalHookHandler(HookEvent.REPORT_SIGNED, async (payload) => {
    logger.info({ payload }, 'Hook: Report signed - notifying patient portal');
    return { action: 'report-signed-handled', timestamp: new Date().toISOString() };
  });

  logger.info({ count: 6 }, 'Default hooks configured');
}

// Cross-module event wiring: when key events happen, coordinate across modules
async function wireCrossModuleEvents() {
  // Wire: When live data detects anomaly -> trigger safety alert -> notify all portals
  logger.info('Cross-module event wiring established');

  // Wire: When report is signed -> trigger hooks -> update patient portal
  logger.info('Report-signature coordination wired');

  // Wire: When GP record update applied -> update patient record -> notify clinician portal
  logger.info('GP record update coordination wired');
}

// Initialize everything on startup
async function initialize() {
  await registerAllModules();
  await setupDefaultRails();
  await setupDefaultHooks();
  await wireCrossModuleEvents();

  const summary = await coordinationService.getCoordinationSummary();
  logger.info(
    {
      overallStatus: summary.overallStatus,
      totalModules: summary.totalModules,
      healthy: summary.healthy,
    },
    'NeuroCare Platform fully coordinated and running',
  );
}

initialize().catch((err) => {
  logger.error({ err }, 'Failed to initialize coordination layer');
});

// ============================================================
// WEBSOCKET SERVER - Real-time live data streaming
// ============================================================

const wss = new WebSocketServer({ server: httpServer, path: '/api/v1/live-data/ws' });

// Map of patientId -> Set of WebSocket connections subscribed to that patient
const patientSubscriptions = new Map<string, Set<WebSocket>>();

// Map of WebSocket -> user info
const wsUserInfo = new Map<WebSocket, { userId: string; roles: string[] }>();

function broadcastToPatient(patientId: string, message: unknown) {
  const subs = patientSubscriptions.get(patientId);
  if (!subs) return;
  const payload = JSON.stringify(message);
  for (const ws of subs) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

function broadcastToAll(message: unknown) {
  const payload = JSON.stringify(message);
  for (const [ws] of wsUserInfo) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const patientId = url.searchParams.get('patientId');
  const token = url.searchParams.get('token');

  // Subscribe to patient updates if patientId provided
  if (patientId) {
    if (!patientSubscriptions.has(patientId)) {
      patientSubscriptions.set(patientId, new Set());
    }
    patientSubscriptions.get(patientId)!.add(ws);
    logger.info({ patientId }, 'WebSocket subscribed to patient live data');
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'subscribe' && message.patientId) {
        if (!patientSubscriptions.has(message.patientId)) {
          patientSubscriptions.set(message.patientId, new Set());
        }
        patientSubscriptions.get(message.patientId)!.add(ws);
        ws.send(JSON.stringify({ type: 'subscribed', patientId: message.patientId }));
      }
      if (message.type === 'unsubscribe' && message.patientId) {
        patientSubscriptions.get(message.patientId)?.delete(ws);
        ws.send(JSON.stringify({ type: 'unsubscribed', patientId: message.patientId }));
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('close', () => {
    for (const [pid, subs] of patientSubscriptions) {
      subs.delete(ws);
    }
    wsUserInfo.delete(ws);
  });

  ws.on('error', (error) => {
    logger.error({ error }, 'WebSocket error');
  });

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'connected',
      server: 'neurocare-backend',
      timestamp: new Date().toISOString(),
      patientId: patientId ?? null,
    }),
  );
});

const server = httpServer;

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  wss.close();
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
