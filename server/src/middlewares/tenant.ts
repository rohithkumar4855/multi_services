import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TenantRequest extends AuthenticatedRequest {
  tenantId?: string | null;
  tenant?: any;
}

/**
 * Authenticated Tenant Context Middleware
 * Extracts and binds `req.tenantId` strictly from the authenticated JWT token.
 * Prevents client-side parameter tampering.
 */
export const tenantContextMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required to resolve tenant context', 401));
    }

    const { tenantId, role, id: userId } = req.user;
    const isSuperAdmin = role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      if (!tenantId) {
        return next(new AppError('Tenant identifier missing in user context', 403));
      }
      req.tenantId = tenantId;

      // Anti-tampering check: overwrite any client-supplied body/query tenantId with verified JWT context
      if (req.body && req.body.tenantId && req.body.tenantId !== tenantId) {
        logger.warn(`[SECURITY] Tampering attempt: User ${userId} tried to supply tenantId ${req.body.tenantId}. Overriding with authenticated tenantId ${tenantId}.`);
        req.body.tenantId = tenantId;
      }
      if (req.query && req.query.tenantId && req.query.tenantId !== tenantId) {
        req.query.tenantId = tenantId;
      }
    } else {
      // Super Admin can optionally specify target tenant via header or query
      const targetTenant = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string) || null;
      req.tenantId = targetTenant;
    }

    logger.info(`[TENANT CONTEXT] Tenant: ${req.tenantId || 'GLOBAL'} | User: ${userId} (${role}) | Method: ${req.method} ${req.url}`);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Public Tenant Resolver Middleware
 * Used for public storefront routes (e.g. browsing catalog, viewing CMS pages, checkout).
 * Resolves tenant via header, subdomain, slug, or custom domain.
 */
export const publicTenantResolverMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Try slug from route param, query param, or header
    let identifier = (req.params.slug || req.params.tenantId || req.query.tenant || req.query.tenantId || req.headers['x-tenant-slug'] || req.headers['x-tenant-id']) as string;

    // 2. Try host/subdomain if no explicit param
    if (!identifier && req.hostname) {
      const hostParts = req.hostname.split('.');
      if (hostParts.length > 2 && hostParts[0] !== 'www' && hostParts[0] !== 'localhost') {
        identifier = hostParts[0];
      }
    }

    if (identifier) {
      const clean = identifier.trim().toLowerCase();
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { slug: clean },
            { id: identifier },
            { customDomain: clean }
          ]
        }
      });

      if (tenant) {
        req.tenantId = tenant.id;
        req.tenant = tenant;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

