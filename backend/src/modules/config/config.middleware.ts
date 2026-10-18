import type { RequestHandler } from 'express';
import { configService } from './config.service.js';
import { forbidden } from '../../shared/errors.js';

/**
 * Middleware that gates a route behind a feature flag.
 * Usage: router.post('/x', requireFeature('ai_insights'), handler)
 */
export const requireFeature =
  (key: string): RequestHandler =>
  async (req, res, next) => {
    const enabled = await configService.isEnabled(key, req.user?.id);
    if (!enabled) return next(forbidden(`Feature '${key}' is not enabled`));
    next();
  };

export { configService };