import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) return next(result.error);
  const data = result.data as { body?: unknown; params?: unknown; query?: unknown };
  req.body = data.body;
  req.params = data.params as unknown as typeof req.params;
  req.query = data.query as unknown as typeof req.query;
  next();
};
