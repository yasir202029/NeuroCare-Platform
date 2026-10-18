import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

/**
 * General API rate limit: 100 requests per 15 minutes per IP.
 */
export const apiRateLimit: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
}) as unknown as RequestHandler;

/**
 * Strict auth rate limit: 5 requests per 15 minutes per IP (login, etc.).
 */
export const authRateLimit: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' } },
}) as unknown as RequestHandler;

/**
 * Strict write rate limit: 30 requests per 15 minutes per IP (mutating endpoints).
 */
export const writeRateLimit: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many write requests, please try again later.' } },
}) as unknown as RequestHandler;
