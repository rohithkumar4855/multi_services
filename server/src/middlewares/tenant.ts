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

    // 2. Try host/domain header from Vercel / edge proxy
    const rawHost = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string) || req.hostname || '';
    const normalizedHost = rawHost.toLowerCase().split(':')[0].trim();

    if (!identifier && normalizedHost && normalizedHost !== 'localhost' && normalizedHost !== '127.0.0.1') {
      // Check if it matches a custom domain or vercel subdomain directly
      identifier = normalizedHost;
    }

    if (identifier) {
      const clean = identifier.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
      
      // Also extract subdomain if it's tenant-slug.vercel.app or tenant-slug.domain.com
      const hostParts = clean.split('.');
      const candidateSlug = (hostParts.length > 2 && hostParts[0] !== 'www') ? hostParts[0] : null;

      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: clean },
            { defaultDomain: clean },
            { slug: clean },
            { id: identifier },
            ...(candidateSlug ? [{ slug: candidateSlug }, { defaultDomain: `${candidateSlug}.vercel.app` }] : []),
            {
              domains: {
                some: { domain: clean }
              }
            }
          ]
        },
        include: {
          websites: {
            include: {
              pages: { where: { isPublished: true }, orderBy: { orderIndex: 'asc' } }
            }
          }
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

/**
 * Optional Tenant Resolver Middleware
 * Allows both authenticated and unauthenticated tenant operations.
 */
export const optionalTenantContextMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user) {
      req.tenantId = req.user.tenantId || (req.headers['x-tenant-id'] as string) || (req.body && req.body.tenantId) || null;
    } else {
      req.tenantId = (req.headers['x-tenant-id'] as string) || (req.body && req.body.tenantId) || (req.query && req.query.tenantId as string) || 'tenant-vip';
    }
    next();
  } catch (err) {
    next(err);
  }
};

