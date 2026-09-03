import { Request, Response, NextFunction } from 'express';
import { VercelDomainService } from '../services/vercel-domain.service';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { TenantRequest } from '../middlewares/tenant';
import { normalizeDomain, getTenantPublicUrl } from '../utils/domain';
import { prisma } from '../config/db';

export class DomainController {
  /**
   * Add a custom domain to the tenant
   */
  static async addDomain(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.body.tenantId;
      const { domain } = req.body;

      if (!tenantId) {
        return next(new AppError('Tenant context required', 400));
      }
      if (!domain) {
        return next(new AppError('Domain name is required', 400));
      }

      const result = await VercelDomainService.addDomain(tenantId, domain);
      sendResponse(res, 200, 'Custom domain registered successfully', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify domain DNS mapping and activate custom domain
   */
  static async verifyDomain(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.body.tenantId;
      const { domain } = req.body;

      if (!tenantId) {
        return next(new AppError('Tenant context required', 400));
      }
      if (!domain) {
        return next(new AppError('Domain name is required for verification', 400));
      }

      const result = await VercelDomainService.verifyDomain(tenantId, domain);
      sendResponse(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove custom domain
   */
  static async removeDomain(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.body.tenantId || (req.query.tenantId as string);
      const domain = req.body.domain || (req.query.domain as string);

      if (!tenantId) {
        return next(new AppError('Tenant context required', 400));
      }

      const result = await VercelDomainService.removeDomain(tenantId, domain);
      sendResponse(res, 200, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get domain configuration & verification status for current tenant
   */
  static async getDomainStatus(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || (req.query.tenantId as string) || req.params.tenantId;
      if (!tenantId) {
        return next(new AppError('Tenant context required', 400));
      }

      const result = await VercelDomainService.getDomainStatus(tenantId);
      sendResponse(res, 200, 'Domain status retrieved successfully', result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public Host / Domain Resolver
   * Resolves tenant workspace from request hostname or ?domain= parameter
   */
  static async resolveHost(req: Request, res: Response, next: NextFunction) {
    try {
      const queryDomain = (req.query.domain as string) || (req.headers['x-forwarded-host'] as string) || req.hostname;
      const clean = normalizeDomain(queryDomain);

      if (!clean) {
        return next(new AppError('Domain identifier required', 400));
      }

      // Check custom domain or slug
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { customDomain: clean },
            { defaultDomain: clean },
            { slug: clean },
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

      if (!tenant) {
        return sendResponse(res, 200, 'Domain not resolved', {
          resolved: false,
          domain: clean,
          publicUrl: 'https://vercel.com/'
        });
      }

      sendResponse(res, 200, 'Domain resolved to tenant workspace', {
        resolved: true,
        domain: clean,
        tenantId: tenant.id,
        tenantName: tenant.name,
        slug: tenant.slug,
        publicUrl: getTenantPublicUrl(tenant),
        tenant
      });
    } catch (err) {
      next(err);
    }
  }
}
