import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { notFound, badRequest } from '../../shared/errors.js';

type FlagValue = Prisma.JsonObject | Prisma.InputJsonValue;

export class ConfigService {
  /** List every feature flag (admin view). */
  async listFlags() {
    return prisma.featureFlag.findMany({ orderBy: [{ key: 'asc' }] });
  }

  /** Get a single flag by key. */
  async getFlag(key: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw notFound(`Feature flag '${key}' not found`);
    return flag;
  }

  /** Public flags only — safe to send to the browser. */
  async getPublicFlags() {
    const flags = await prisma.featureFlag.findMany({
      where: { enabled: true },
      select: { key: true, name: true, description: true, rolloutPct: true },
    });
    return flags;
  }

  /** Check whether a flag is enabled, optionally respecting rollout percentage. */
  async isEnabled(key: string, userId?: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag || !flag.enabled) return false;
    if (flag.rolloutPct >= 100) return true;
    if (flag.rolloutPct <= 0) return false;
    if (userId) {
      // Stable per-user bucket: hash userId + key into [0,100)
      const bucket = Number(
        parseInt(
          require('crypto')
            .createHash('sha256')
            .update(`${key}:${userId}`)
            .digest('hex')
            .slice(0, 7),
          16,
        ) % 100,
      );
      return bucket < flag.rolloutPct;
    }
    return false;
  }

  /** Create or update a feature flag (admin). */
  async upsertFlag(key: string, data: { name?: string; description?: string; enabled?: boolean; rolloutPct?: number }) {
    if (data.rolloutPct !== undefined && (data.rolloutPct < 0 || data.rolloutPct > 100)) {
      throw badRequest('rolloutPct must be between 0 and 100');
    }
    return prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        name: data.name ?? key,
        description: data.description,
        enabled: data.enabled ?? false,
        rolloutPct: data.rolloutPct ?? 0,
        conditions: {} as Prisma.InputJsonValue,
      },
      update: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        enabled: data.enabled ?? undefined,
        rolloutPct: data.rolloutPct ?? undefined,
      },
    });
  }

  /** Delete a feature flag (admin). */
  async deleteFlag(key: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw notFound(`Feature flag '${key}' not found`);
    await prisma.featureFlag.delete({ where: { key } });
    return { ok: true };
  }
}

export const configService = new ConfigService();