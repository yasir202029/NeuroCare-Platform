import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { config } from './shared/config.js';
import { logger } from './infrastructure/logger.js';
import routes from './routes/index.js';
import { requestContext } from './middleware/request-context.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(requestContext);
app.use((req, _res, next) => { logger.info({ requestId: req.requestId, method: req.method, path: req.path }, 'Request started'); next(); });
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/api/v1', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
