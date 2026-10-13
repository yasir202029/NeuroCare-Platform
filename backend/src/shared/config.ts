import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default('neurocare-backend'),
  JWT_AUDIENCE: z.string().default('neurocare-clients'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  MFA_CODE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  EMAIL_VERIFICATION_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
  PASSWORD_HASH_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  TEAMS_TENANT_ID: z.string().optional(),
  TEAMS_CLIENT_ID: z.string().optional(),
  TEAMS_CLIENT_SECRET: z.string().optional(),
  ZOOM_ACCOUNT_ID: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  VIDEO_DEFAULT_PROVIDER: z.enum(['TEAMS', 'ZOOM']).default('ZOOM'),
  VIDEO_RECORDING_ENABLED: z.coerce.boolean().default(false),
  TRANSCRIPTION_PROVIDER: z.enum(['openai', 'deepgram', 'mock']).default('mock'),
  TRANSCRIPTION_LANGUAGE: z.string().default('en-GB'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_REPORT_MODEL: z.string().default('gpt-4o-mini'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMS_PROVIDER: z.string().default('log'),
});

export const config = schema.parse(process.env);
export const isProduction = config.NODE_ENV === 'production';
