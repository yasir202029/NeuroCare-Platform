import { app } from './app.js';
import { config } from './shared/config.js';
import { disconnectDatabase } from './shared/db.js';
import { logger } from './infrastructure/logger.js';

const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'NeuroCare backend listening'));

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => { await disconnectDatabase(); process.exit(0); });
};
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
