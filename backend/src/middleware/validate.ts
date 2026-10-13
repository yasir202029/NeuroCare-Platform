import type { RequestHandler } from 'express';
import type { z } from 'zod';

export const validate = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) return next(result.error);
  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;
  next();
};
