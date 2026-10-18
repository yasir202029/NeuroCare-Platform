import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { logger } from '../../infrastructure/logger.js';

export type ModuleStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE';

export interface ModuleHealth {
  module: string;
  serviceName: string;
  status: ModuleStatus;
  lastHeartbeat?: Date;
  lastCheck?: Date;
  metadata?: Record<string, unknown>;
}

export interface CrossModuleEvent {
  eventType: string;
  sourceModule: string;
  targetModule?: string;
  patientId?: string;
  actorId?: string;
  payload: Record<string, unknown>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class ServiceCoordinationService {
  private healthCache = new Map<string, ModuleHealth>();

  /**
   * Register a module's health status
   */
  async registerModule(
    module: string,
    serviceName: string,
    status: ModuleStatus,
    metadata?: Record<string, unknown>,
  ) {
    const now = new Date();
    const record = await prisma.serviceCoordination.upsert({
      where: { module_serviceName: { module, serviceName } },
      update: {
        status,
        lastHeartbeat: now,
        lastCheck: now,
        metadata: metadata as Prisma.InputJsonValue,
        updatedAt: now,
      },
      create: {
        module,
        serviceName,
        status,
        lastHeartbeat: now,
        lastCheck: now,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    this.healthCache.set(`${module}:${serviceName}`, {
      module,
      serviceName,
      status,
      lastHeartbeat: record.lastHeartbeat ?? undefined,
      lastCheck: record.lastCheck ?? undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
    });

    logger.info(
      { module, serviceName, status },
      'Module health registered',
    );
    return record;
  }

  /**
   * Get all module health statuses
   */
  async getAllModuleHealth(): Promise<ModuleHealth[]> {
    const records = await prisma.serviceCoordination.findMany({
      orderBy: [{ module: 'asc' }, { serviceName: 'asc' }],
    });

    this.healthCache.clear();
    for (const record of records) {
      this.healthCache.set(`${record.module}:${record.serviceName}`, {
        module: record.module,
        serviceName: record.serviceName,
        status: record.status as ModuleStatus,
        lastHeartbeat: record.lastHeartbeat ?? undefined,
        lastCheck: record.lastCheck ?? undefined,
        metadata: record.metadata as Record<string, unknown> | undefined,
      });
    }

    return records.map((r) => ({
      module: r.module,
      serviceName: r.serviceName,
      status: r.status as ModuleStatus,
      lastHeartbeat: r.lastHeartbeat ?? undefined,
      lastCheck: r.lastCheck ?? undefined,
      metadata: r.metadata as Record<string, unknown> | undefined,
    }));
  }

  /**
   * Get health for a specific module
   */
  async getModuleHealth(module: string, serviceName: string): Promise<ModuleHealth | null> {
    const record = await prisma.serviceCoordination.findUnique({
      where: { module_serviceName: { module, serviceName } },
    });
    if (!record) return null;
    return {
      module: record.module,
      serviceName: record.serviceName,
      status: record.status as ModuleStatus,
      lastHeartbeat: record.lastHeartbeat ?? undefined,
      lastCheck: record.lastCheck ?? undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Get unhealthy modules
   */
  async getUnhealthyModules(): Promise<ModuleHealth[]> {
    return (await this.getAllModuleHealth()).filter(
      (h) => h.status === 'DOWN' || h.status === 'MAINTENANCE',
    );
  }

  /**
   * Emit a cross-module event for coordination
   */
  async emitCrossModuleEvent(event: CrossModuleEvent) {
    logger.info(
      { eventType: event.eventType, sourceModule: event.sourceModule, targetModule: event.targetModule, patientId: event.patientId },
      'Cross-module event emitted',
    );

    // Store as a live data stream event for coordination tracking
    if (event.patientId) {
      await prisma.liveDataStreamEvent.create({
        data: {
          patientId: event.patientId,
          eventType: event.eventType,
          source: event.sourceModule,
          payload: event.payload as Prisma.InputJsonValue,
          processed: false,
        },
      });
    }

    return { eventId: `evt-${Date.now()}`, processed: false };
  }

  /**
   * Get coordination status summary
   */
  async getCoordinationSummary() {
    const allHealth = await this.getAllModuleHealth();
    const total = allHealth.length;
    const healthy = allHealth.filter((h) => h.status === 'HEALTHY').length;
    const degraded = allHealth.filter((h) => h.status === 'DEGRADED').length;
    const down = allHealth.filter((h) => h.status === 'DOWN').length;
    const maintenance = allHealth.filter((h) => h.status === 'MAINTENANCE').length;

    return {
      totalModules: total,
      healthy,
      degraded,
      down,
      maintenance,
      overallStatus:
        down > 0 ? 'DOWN' :
        maintenance > 0 ? 'MAINTENANCE' :
        degraded > 0 ? 'DEGRADED' : 'HEALTHY',
      modules: allHealth,
      lastUpdated: new Date().toISOString(),
    };
  }
}
