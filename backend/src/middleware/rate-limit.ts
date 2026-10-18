import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { config } from '../shared/config.js';

const windowMs = config.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;

/** Disabled limiter (pass-through) when RATE_LIMIT_ENABLED=false (dev/test). */
const disabledLimiter: RequestHandler = (_req, _res, next) => next();

/**
 * General API rate limit: RATE_LIMIT_API_MAX requests per window per IP.
 */
export const apiRateLimit: RequestHandler = config.RATE_LIMIT_ENABLED
  ? (rateLimit({
      windowMs,
      max: config.RATE_LIMIT_API_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
    }) as unknown as RequestHandler)
  : disabledLimiter;

/**
 * Strict auth rate limit: RATE_LIMIT_AUTH_MAX requests per window per IP (login, etc.).
 */
export const authRateLimit: RequestHandler = config.RATE_LIMIT_ENABLED
  ? (rateLimit({
      windowMs,
      max: config.RATE_LIMIT_AUTH_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' } },
    }) as unknown as RequestHandler)
  : disabledLimiter;

/**
 * Strict write rate limit: RATE_LIMIT_WRITE_MAX requests per window per IP (mutating endpoints).
 */
export const writeRateLimit: RequestHandler = config.RATE_LIMIT_ENABLED
  ? (rateLimit({
      windowMs,
      max: config.RATE_LIMIT_WRITE_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many write requests, please try again later.' } },
    }) as unknown as RequestHandler)
  : disabledLimiter;
