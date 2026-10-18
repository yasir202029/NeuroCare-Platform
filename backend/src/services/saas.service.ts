import { config } from '../shared/config.js';
import { prisma } from '../shared/db.js';
import { Stripe } from 'stripe';
import { badRequest, notFound, forbidden } from '../shared/errors.js';
import { SubscriptionTier, BillingInterval, Prisma } from '@prisma/client';
import crypto from 'node:crypto';

export type SaaSPlan = {
  id: string;
  key: string;
  name: string;
  tier: SubscriptionTier;
  description?: string | null;
  pricePence: number;
  interval: BillingInterval;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  active: boolean;
};

export type OrgUsage = {
  metric: string;
  period: string;
  count: number;
  limit?: number | null;
  resetAt: Date;
};

export class SaaSService {
  private stripe: Stripe | null;

  constructor() {
    this.stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;
  }

  async listPlans() {
    return prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: [{ tier: 'asc' }, { pricePence: 'asc' }] });
  }

  async createPlan(input: {
    key: string;
    name: string;
    tier: SubscriptionTier;
    description?: string;
    pricePence: number;
    interval: BillingInterval;
    features?: Record<string, unknown>;
    limits?: Record<string, unknown>;
  }) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { key: input.key } });
    if (existing) throw badRequest('Plan key already exists');
    return prisma.subscriptionPlan.create({
      data: {
        key: input.key,
        name: input.name,
        tier: input.tier,
        description: input.description,
        pricePence: input.pricePence,
        interval: input.interval,
        features: (input.features ?? {}) as unknown as Prisma.InputJsonValue,
        limits: (input.limits ?? {}) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, include: { plan: true, members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } }, usageMeters: true, apiKeys: { where: { active: true } }, subscriptionInvoices: { orderBy: [{ createdAt: 'desc' }], take: 10 }, trialRecords: { orderBy: [{ startedAt: 'desc' }], take: 5 } } });
    if (!org) throw notFound('Organization not found');
    return org;
  }

  async updateOrganization(orgId: string, input: { name?: string; tier?: SubscriptionTier; branding?: Record<string, unknown>; settings?: Record<string, unknown> }) {
    return prisma.organization.update({ where: { id: orgId }, data: { ...(input.name !== undefined && { name: input.name }), ...(input.tier !== undefined && { tier: input.tier }), ...(input.branding !== undefined && { branding: input.branding as unknown as Prisma.InputJsonValue }), ...(input.settings !== undefined && { settings: input.settings as unknown as Prisma.InputJsonValue }) } });
  }

  async addMember(orgId: string, input: { userId: string; role?: string }) {
    const existing = await prisma.organizationMember.findUnique({ where: { orgId_userId: { orgId, userId: input.userId } } });
    if (existing) throw badRequest('User is already a member of this organization');
    return prisma.organizationMember.create({ data: { orgId, userId: input.userId, role: input.role ?? 'MEMBER' }, include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } });
  }

  async removeMember(orgId: string, userId: string) {
    const member = await prisma.organizationMember.findUnique({ where: { orgId_userId: { orgId, userId } } });
    if (!member) throw notFound('Member not found');
    return prisma.organizationMember.delete({ where: { id: member.id } });
  }

  async recordUsage(orgId: string, input: { metric: string; count?: number; period?: string }) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const period = input.period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const existing = await prisma.usageMeter.findUnique({ where: { orgId_metric_period: { orgId, metric: input.metric, period } } });
    if (existing) {
      return prisma.usageMeter.update({
        where: { id: existing.id },
        data: { count: existing.count + (input.count ?? 1), resetAt },
      });
    }
    return prisma.usageMeter.create({ data: { orgId, metric: input.metric, period, count: input.count ?? 1, limit: null, resetAt } });
  }

  async getUsage(orgId: string) {
    return prisma.usageMeter.findMany({ where: { orgId }, orderBy: [{ metric: 'asc' }] });
  }

  async createApiKey(orgId: string, input: { name: string; scopes?: string[]; expiresInDays?: number }) {
    const prefix = `nc_${orgId.slice(0, 8)}_`;
    const rawKey = `nc_live_${Buffer.from(crypto.randomUUID() + crypto.randomUUID()).toString('hex').slice(0, 32)}`;
    const keyHash = await this.hash(rawKey);
    const expiresAt = input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000) : null;
    const key = await prisma.apiKey.create({ data: { orgId, name: input.name, keyHash, prefix, scopes: input.scopes ?? [], expiresAt } });
    return { ...key, rawKey };
  }

  async listApiKeys(orgId: string) {
    return prisma.apiKey.findMany({ where: { orgId }, orderBy: [{ createdAt: 'desc' }] });
  }

  async revokeApiKey(orgId: string, keyId: string) {
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, orgId } });
    if (!key) throw notFound('API key not found');
    return prisma.apiKey.update({ where: { id: keyId }, data: { active: false } });
  }

  async listFeatureFlags() {
    return prisma.featureFlag.findMany({ orderBy: [{ key: 'asc' }] });
  }

  async setFeatureFlag(input: { key: string; name: string; description?: string; enabled?: boolean; rolloutPct?: number; conditions?: Record<string, unknown> }) {
    const existing = await prisma.featureFlag.findUnique({ where: { key: input.key } });
    if (existing) {
      return prisma.featureFlag.update({ where: { key: input.key }, data: { ...(input.name !== undefined && { name: input.name }), ...(input.description !== undefined && { description: input.description }), ...(input.enabled !== undefined && { enabled: input.enabled }), ...(input.rolloutPct !== undefined && { rolloutPct: input.rolloutPct }), ...(input.conditions !== undefined && { conditions: input.conditions as unknown as Prisma.InputJsonValue }) } });
    }
    return prisma.featureFlag.create({ data: { key: input.key, name: input.name, description: input.description, enabled: input.enabled ?? false, rolloutPct: input.rolloutPct ?? 0, conditions: (input.conditions ?? {}) as unknown as Prisma.InputJsonValue } });
  }

  async checkFeatureFlag(key: string, orgId?: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag || !flag.enabled) return { enabled: false, reason: 'not_found_or_disabled' };
    if (flag.rolloutPct < 100 && orgId) {
      const hash = this.simpleHash(`${orgId}:${key}`);
      const pct = hash % 100;
      return { enabled: pct < flag.rolloutPct, reason: 'rollout' };
    }
    return { enabled: true, reason: 'global' };
  }

  async startTrial(orgId: string, input: { tier: SubscriptionTier }) {
    const existing = await prisma.trialRecord.findFirst({ where: { orgId } });
    if (existing) throw badRequest('Trial already exists for this organization');
    const startedAt = new Date();
    const endsAt = new Date(Date.now() + 14 * 86400000);
    return prisma.trialRecord.create({ data: { orgId, tier: input.tier, startedAt, endsAt } });
  }

  async getTrial(orgId: string) {
    return prisma.trialRecord.findFirst({ where: { orgId }, orderBy: [{ startedAt: 'desc' }] });
  }

  private async hash(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private simpleHash(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
