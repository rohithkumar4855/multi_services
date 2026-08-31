import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { TenantService } from '../services/tenant.service';
import { AuthService } from '../services/auth.service';
import { authenticate, authorize } from '../middlewares/auth';
import { tenantContextMiddleware, TenantRequest } from '../middlewares/tenant';

const router = Router();

// Public Admin Tenant Registration with Automatic Website Generation
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await TenantService.registerTenant({
      ...req.body,
      ipAddress,
      userAgent
    });

    sendResponse(res, 201, 'Tenant and website auto-generated successfully', result);
  } catch (err) {
    next(err);
  }
});

// Admin / Tenant Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.login(req.body);
    sendResponse(res, 200, 'Login successful', result);
  } catch (err) {
    next(err);
  }
});

// Public Website / Tenant Resolution by slug, custom domain, or ID
router.get('/resolve/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const tenant = await TenantService.resolveTenant(slug);
    if (!tenant) {
      return next(new AppError('Website or Tenant not found for this domain/slug', 404));
    }
    sendResponse(res, 200, 'Tenant resolved successfully', tenant);
  } catch (err) {
    next(err);
  }
});

// Super Admin / Authenticated: Get all tenants
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true }
        },
        websites: {
          select: { id: true, name: true, slug: true, isPublished: true }
        },
        _count: {
          select: { users: true, orders: true, payments: true, services: true, products: true }
        }
      }
    });

    sendResponse(res, 200, 'Tenants retrieved successfully', tenants);
  } catch (err) {
    next(err);
  }
});

// Get current tenant's configuration
router.get('/current', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) {
      return next(new AppError('No tenant context available', 400));
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      include: {
        websites: {
          include: {
            pages: { orderBy: { orderIndex: 'asc' } }
          }
        },
        subscriptions: true
      }
    });

    if (!tenant) {
      return next(new AppError('Tenant not found', 404));
    }

    sendResponse(res, 200, 'Current tenant configuration retrieved', tenant);
  } catch (err) {
    next(err);
  }
});

// Update tenant configuration & branding
router.put('/:id', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin && req.tenantId !== id) {
      return next(new AppError('Forbidden: Cannot modify another tenant configuration', 403));
    }

    const updated = await TenantService.updateTenantConfig(id, req.body, req.user?.id);
    sendResponse(res, 200, 'Tenant configuration updated successfully', updated);
  } catch (err) {
    next(err);
  }
});

export default router;
