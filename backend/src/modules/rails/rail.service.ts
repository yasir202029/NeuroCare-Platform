import { Prisma, RailSeverity, RailAction, RailScope, HookEvent, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { logger } from '../../infrastructure/logger.js';
import { HookService } from '../hooks/hook.service.js';

export class RailService {
  constructor(private hookService?: HookService) {}

  /**
   * Create a rail/guardrail rule
   */
  async createRail(input: {
    name: string;
    description?: string;
    event: HookEvent;
    scope: RailScope;
    scopeValue?: string;
    severity: RailSeverity;
    action: RailAction;
    condition: Record<string, unknown>;
    createdById: string;
  }) {
    const rail = await prisma.rail.create({
      data: {
        name: input.name,
        description: input.description,
        event: input.event,
        scope: input.scope,
        scopeValue: input.scopeValue,
        severity: input.severity,
        action: input.action,
        condition: input.condition as Prisma.InputJsonValue,
        isEnabled: true,
        createdById: input.createdById,
      },
    });

    logger.info({ railId: rail.id, event: input.event, action: input.action }, 'Rail created');
    return rail;
  }

  /**
   * Get all rails
   */
  async getRails(filter?: {
    event?: HookEvent;
    scope?: RailScope;
    isEnabled?: boolean;
  }) {
    const where: Record<string, unknown> = {};
    if (filter?.event) where.event = filter.event;
    if (filter?.scope) where.scope = filter.scope;
    if (filter?.isEnabled !== undefined) where.isEnabled = filter.isEnabled;

    return prisma.rail.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        railViolations: {
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get rail by ID
   */
  async getRail(railId: string) {
    const rail = await prisma.rail.findUnique({
      where: { id: railId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        railViolations: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!rail) throw notFound('Rail not found');
    return rail;
  }

  /**
   * Update rail
   */
  async updateRail(railId: string, input: {
    name?: string;
    description?: string;
    severity?: RailSeverity;
    action?: RailAction;
    condition?: Record<string, unknown>;
    isEnabled?: boolean;
  }) {
    const rail = await prisma.rail.findUnique({ where: { id: railId } });
    if (!rail) throw notFound('Rail not found');

    return prisma.rail.update({
      where: { id: railId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.severity !== undefined && { severity: input.severity }),
        ...(input.action !== undefined && { action: input.action }),
        ...(input.condition !== undefined && { condition: input.condition as Prisma.InputJsonValue }),
        ...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
      },
    });
  }

  /**
   * Delete rail
   */
  async deleteRail(railId: string) {
    const rail = await prisma.rail.findUnique({ where: { id: railId } });
    if (!rail) throw notFound('Rail not found');

    await prisma.rail.delete({ where: { id: railId } });
    return { deleted: true };
  }

  /**
   * Evaluate rails for an event and context
   * Returns violations that need action
   */
  async evaluateRails(
    event: HookEvent,
    context: {
      patientId?: string;
      actorId?: string;
      role?: string;
      organizationId?: string;
      data: Record<string, unknown>;
    },
  ): Promise<{
    violations: Array<{
      railId: string;
      railName: string;
      severity: RailSeverity;
      action: RailAction;
      context: Record<string, unknown>;
      requiresAction: boolean;
    }>;
    blocked: boolean;
    warnings: string[];
  }> {
    const rails = await prisma.rail.findMany({
      where: {
        event,
        isEnabled: true,
      },
      include: {
        railViolations: {
          where: { resolved: false },
          take: 1,
        },
      },
    });

    const violations: Array<{
      railId: string;
      railName: string;
      severity: RailSeverity;
      action: RailAction;
      context: Record<string, unknown>;
      requiresAction: boolean;
    }> = [];

    let blocked = false;
    const warnings: string[] = [];

    for (const rail of rails) {
      // Check scope
      if (!this.matchesScope(rail, context)) continue;

      // Evaluate condition (simple JSON logic evaluation)
      const triggered = this.evaluateCondition(rail.condition as Record<string, unknown>, context.data);

      if (triggered) {
        // Check if there's already an unresolved violation for this rail+patient
        const existingViolation = context.patientId
          ? await prisma.railViolation.findFirst({
              where: {
                railId: rail.id,
                patientId: context.patientId,
                resolved: false,
              },
            })
          : null;

        if (!existingViolation) {
          const violation = await prisma.railViolation.create({
            data: {
              railId: rail.id,
              event,
              patientId: context.patientId,
              actorId: context.actorId,
              severity: rail.severity,
              actionTaken: rail.action,
              context: context.data as Prisma.InputJsonValue,
              resolved: false,
            },
            include: {
              patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
              actor: { select: { id: true, firstName: true, lastName: true } },
            },
          });

          violations.push({
            railId: rail.id,
            railName: rail.name,
            severity: rail.severity,
            action: rail.action,
            context: context.data,
            requiresAction: rail.action === 'REQUIRE_APPROVAL' || rail.action === 'BLOCK',
          });

          if (rail.action === 'BLOCK') {
            blocked = true;
          } else if (rail.action === 'WARN') {
            warnings.push(`Rail "${rail.name}" triggered: ${rail.description ?? 'No description'}`);
          }

          logger.warn(
            {
              railId: rail.id,
              railName: rail.name,
              event,
              patientId: context.patientId,
              severity: rail.severity,
              action: rail.action,
            },
            'Rail violation triggered',
          );
        }
      }
    }

    return { violations, blocked, warnings };
  }

  /**
   * Get all rail violations
   */
  async getViolations(filter?: {
    patientId?: string;
    resolved?: boolean;
    severity?: RailSeverity;
  }) {
    const where: Record<string, unknown> = {};
    if (filter?.patientId) where.patientId = filter.patientId;
    if (filter?.resolved !== undefined) where.resolved = filter.resolved;
    if (filter?.severity) where.severity = filter.severity;

    return prisma.railViolation.findMany({
      where,
      include: {
        rail: { select: { id: true, name: true, action: true, severity: true } },
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        actor: { select: { id: true, firstName: true, lastName: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Resolve a rail violation
   */
  async resolveViolation(
    violationId: string,
    resolvedById: string,
    resolutionNote?: string,
  ) {
    const violation = await prisma.railViolation.findUnique({
      where: { id: violationId },
    });
    if (!violation) throw notFound('Rail violation not found');

    return prisma.railViolation.update({
      where: { id: violationId },
      data: {
        resolved: true,
        resolvedById,
        resolvedAt: new Date(),
        resolutionNote,
      },
    });
  }

  /**
   * Get rail statistics
   */
  async getRailStats() {
    const totalRails = await prisma.rail.count();
    const activeRails = await prisma.rail.count({ where: { isEnabled: true } });
    const totalViolations = await prisma.railViolation.count();
    const unresolvedViolations = await prisma.railViolation.count({
      where: { resolved: false },
    });
    const violationsBySeverity = await prisma.railViolation.groupBy({
      by: ['severity'],
      where: { resolved: false },
      _count: true,
    });

    return {
      totalRails,
      activeRails,
      totalViolations,
      unresolvedViolations,
      violationsBySeverity,
    };
  }

  /**
   * Check if a rail's scope matches the context
   */
  private matchesScope(rail: any, context: any): boolean {
    switch (rail.scope) {
      case 'GLOBAL':
        return true;
      case 'ROLE':
        return rail.scopeValue === context.role;
      case 'PATIENT':
        return rail.scopeValue === context.patientId;
      case 'ORGANIZATION':
        return rail.scopeValue === context.organizationId;
      default:
        return true;
    }
  }

  /**
   * Simple JSON condition evaluation
   * Supports: { field: { operator: value } } or { field: value } (equality)
   * Operators: eq, ne, gt, lt, gte, lte, contains, in, not_in
   */
  private evaluateCondition(
    condition: Record<string, unknown>,
    data: Record<string, unknown>,
  ): boolean {
    for (const [field, conditionValue] of Object.entries(condition)) {
      const fieldValue = data[field];

      if (conditionValue && typeof conditionValue === 'object' && !Array.isArray(conditionValue)) {
        // Object condition with operators
        const condObj = conditionValue as Record<string, unknown>;
        for (const [operator, operatorValue] of Object.entries(condObj)) {
          if (!this.evaluateOperator(fieldValue, operator, operatorValue)) {
            return false;
          }
        }
      } else {
        // Simple equality
        if (fieldValue !== conditionValue) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Evaluate a single operator condition
   */
  private evaluateOperator(
    fieldValue: unknown,
    operator: string,
    operatorValue: unknown,
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue === operatorValue;
      case 'ne':
        return fieldValue !== operatorValue;
      case 'gt':
        return Number(fieldValue) > Number(operatorValue);
      case 'lt':
        return Number(fieldValue) < Number(operatorValue);
      case 'gte':
        return Number(fieldValue) >= Number(operatorValue);
      case 'lte':
        return Number(fieldValue) <= Number(operatorValue);
      case 'contains':
        return String(fieldValue).includes(String(operatorValue));
      case 'in':
        return Array.isArray(operatorValue) && operatorValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(operatorValue) && !operatorValue.includes(fieldValue);
      default:
        return true;
    }
  }
}
