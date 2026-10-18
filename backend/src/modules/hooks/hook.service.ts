import { Prisma, HookEvent, HookStatus, Role } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { asyncHandler } from '../../shared/http.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { logger } from '../../infrastructure/logger.js';

type HookHandler = (payload: any) => Promise<any>;

// Internal hook handlers registry
const internalHandlers = new Map<string, HookHandler>();

export function registerInternalHookHandler(event: HookEvent, handler: HookHandler) {
  internalHandlers.set(event, handler);
}

export class HookService {
  /**
   * Create a hook definition
   */
  async createHook(input: {
    name: string;
    description?: string;
    event: HookEvent;
    targetUrl?: string;
    secret?: string;
    isInternal?: boolean;
    handlerName?: string;
    config?: Record<string, unknown>;
    retryCount?: number;
    timeoutMs?: number;
    createdById: string;
  }) {
    const hook = await prisma.hook.create({
      data: {
        name: input.name,
        description: input.description,
        event: input.event,
        status: HookStatus.ACTIVE,
        targetUrl: input.targetUrl,
        secret: input.secret,
        isInternal: input.isInternal ?? true,
        handlerName: input.handlerName,
        config: input.config as Prisma.InputJsonValue | undefined,
        retryCount: input.retryCount ?? 3,
        timeoutMs: input.timeoutMs ?? 5000,
        createdById: input.createdById,
      },
    });

    // If internal handler exists, register it
    if (input.isInternal !== false && input.handlerName) {
      // Handler registration is done via registerInternalHookHandler
    }

    logger.info({ hookId: hook.id, event: input.event }, 'Hook created');
    return hook;
  }

  /**
   * Get all hooks
   */
  async getHooks(filter?: { event?: HookEvent; status?: HookStatus }) {
    const where: Record<string, unknown> = {};
    if (filter?.event) where.event = filter.event;
    if (filter?.status) where.status = filter.status;

    return prisma.hook.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get hook by ID
   */
  async getHook(hookId: string) {
    const hook = await prisma.hook.findUnique({
      where: { id: hookId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        hookExecutions: {
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!hook) throw notFound('Hook not found');
    return hook;
  }

  /**
   * Update hook status
   */
  async updateHookStatus(hookId: string, status: HookStatus) {
    const hook = await prisma.hook.findUnique({ where: { id: hookId } });
    if (!hook) throw notFound('Hook not found');

    return prisma.hook.update({
      where: { id: hookId },
      data: { status },
    });
  }

  /**
   * Execute a hook (internal or external webhook)
   */
  async executeHook(
    hookId: string,
    event: HookEvent,
    payload: Record<string, unknown>,
  ) {
    const hook = await prisma.hook.findUnique({ where: { id: hookId } });
    if (!hook) throw notFound('Hook not found');
    if (hook.status !== HookStatus.ACTIVE) {
      throw badRequest('Hook is not active');
    }

    const startTime = Date.now();
    let executionStatus = 'SUCCESS';
    let responsePayload: any = null;
    let errorMessage: string | null = null;

    try {
      if (hook.isInternal && hook.handlerName) {
        const handler = internalHandlers.get(hook.event as HookEvent);
        if (handler) {
          responsePayload = await handler(payload);
        } else {
          throw new Error(`No internal handler registered for event ${hook.event}`);
        }
      } else if (hook.targetUrl) {
        // External webhook
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), hook.timeoutMs);

        try {
          const response = await fetch(hook.targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(hook.secret ? { 'X-Hook-Secret': hook.secret } : {}),
            },
            body: JSON.stringify({ event, payload, hookId: hook.id }),
            signal: controller.signal,
          });

          responsePayload = await response.json().catch(() => ({ status: response.status }));
          if (!response.ok) {
            executionStatus = 'FAILED';
            errorMessage = `HTTP ${response.status}`;
          }
        } catch (err: any) {
          executionStatus = 'FAILED';
          errorMessage = err.message;
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        throw new Error('Hook has no target URL or handler');
      }
    } catch (err: any) {
      executionStatus = 'FAILED';
      errorMessage = err.message;
    }

    const durationMs = Date.now() - startTime;

    // Determine attempt number
    const lastExecution = await prisma.hookExecution.findFirst({
      where: { hookId },
      orderBy: { attempt: 'desc' },
    });
    const attempt = (lastExecution?.attempt ?? 0) + 1;

    const execution = await prisma.hookExecution.create({
      data: {
        hookId,
        event,
        status: executionStatus,
        attempt,
        requestPayload: payload as Prisma.InputJsonValue,
        responsePayload: responsePayload as Prisma.InputJsonValue | undefined,
        errorMessage,
        durationMs,
      },
    });

    // Retry if failed and within retry count
    if (executionStatus === 'FAILED' && attempt < (hook.retryCount ?? 3)) {
      setTimeout(() => {
        this.executeHook(hookId, event, payload).catch((err) =>
          logger.error({ hookId, err }, 'Hook retry failed'),
        );
      }, 1000 * attempt);
    }

    logger.info(
      { hookId, event, status: executionStatus, durationMs },
      'Hook executed',
    );

    return execution;
  }

  /**
   * Get hook executions
   */
  async getExecutions(filter?: { hookId?: string; event?: HookEvent; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filter?.hookId) where.hookId = filter.hookId;
    if (filter?.event) where.event = filter.event;
    if (filter?.status) where.status = filter.status;

    return prisma.hookExecution.findMany({
      where,
      include: {
        hook: { select: { id: true, name: true, event: true } },
      },
      orderBy: { executedAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Trigger hooks for an event across all active hooks
   */
  async triggerEventHooks(
    event: HookEvent,
    payload: Record<string, unknown>,
  ) {
    const hooks = await prisma.hook.findMany({
      where: { event, status: HookStatus.ACTIVE },
    });

    const results = await Promise.all(
      hooks.map((hook) => this.executeHook(hook.id, event, payload)),
    );

    return results;
  }
}
