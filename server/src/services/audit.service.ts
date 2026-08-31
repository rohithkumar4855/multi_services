import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export interface CreateAuditLogParams {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      const {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent
      } = params;

      logger.info(`[AUDIT] Action: ${action} | Entity: ${entityType} (${entityId || 'N/A'}) | Tenant: ${tenantId || 'GLOBAL'} | User: ${userId || 'SYSTEM'}`);

      if (tenantId) {
        await prisma.auditLog.create({
          data: {
            tenantId,
            userId: userId || null,
            action,
            entityType,
            entityId: entityId || null,
            oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
            newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null
          }
        });
      }
    } catch (err: any) {
      logger.error(`Failed to record audit log: ${err.message}`);
    }
  }

  static async getTenantLogs(tenantId: string, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }

  static async getGlobalLogs(limit: number = 100) {
    return await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        },
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }
}
