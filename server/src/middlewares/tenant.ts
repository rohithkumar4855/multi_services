import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/db';
import { getTenantPrismaClient } from '../config/tenantDb';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TenantRequest extends AuthenticatedRequest {
  db?: {
    run: <T>(callback: (tx: any) => Promise<T>) => Promise<T>;
  };
}

export const tenantContextMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verify User Authentication exists
    if (!req.user) {
      return next(new AppError('Authentication required to resolve tenant context', 401));
    }

    const { tenantId, role, id: userId } = req.user;
    const isSuperAdmin = role === 'SUPER_ADMIN';

    // 2. Tenant Validation
    if (!isSuperAdmin) {
      if (!tenantId) {
        return next(new AppError('Tenant identifier missing in context', 400));
      }

      // Check database to verify tenant status
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return next(new AppError('Tenant not found', 404));
      }
      
      // If billing configs or active features are suspended:
      if ((tenant.config as any)?.status === 'suspended') {
        return next(new AppError('Tenant account is suspended', 403));
      }
    }

    // 3. Bind Scoped Prisma Provider to Request
    req.db = getTenantPrismaClient(tenantId, isSuperAdmin);

    // 4. Audit Log Execution details
    logger.info(`[AUDIT] Tenant ID: ${tenantId || 'GLOBAL'} | User ID: ${userId} | IP: ${req.ip} | Route: ${req.method} ${req.url}`);

    next();
  } catch (err) {
    next(err);
  }
};
