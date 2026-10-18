import { app } from './app.js';
import { config } from './shared/config.js';
import { disconnectDatabase } from './shared/db.js';
import { logger } from './infrastructure/logger.js';
import { WebSocketServer, WebSocket } from 'ws';
import { LiveDataService } from './modules/live-data/live-data.service.js';

const httpServer = app.listen(config.PORT, () =>
  logger.info({ port: config.PORT }, 'NeuroCare backend listening'),
);

// WebSocket server for real-time live data streaming
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

// Create LiveDataService with WebSocket broadcasting
const liveDataService = new LiveDataService((patientId, message) => {
  broadcastToPatient(patientId, message);
});

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
