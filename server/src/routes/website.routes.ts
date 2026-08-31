import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { authenticate } from '../middlewares/auth';
import { tenantContextMiddleware, TenantRequest } from '../middlewares/tenant';
import { AuditService } from '../services/audit.service';

const router = Router();

// Public: Get all published pages for a tenant slug or custom domain
router.get('/pages/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: slug.toLowerCase() },
          { id: slug },
          { customDomain: slug.toLowerCase() }
        ]
      }
    });

    if (!tenant) {
      return next(new AppError('Website not found', 404));
    }

    const pages = await prisma.websitePage.findMany({
      where: { tenantId: tenant.id, isPublished: true },
      orderBy: { orderIndex: 'asc' }
    });

    sendResponse(res, 200, 'Website pages retrieved', { tenant, pages });
  } catch (err) {
    next(err);
  }
});

// Admin: Get all pages (including drafts) for authenticated tenant
router.get('/admin/pages', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const pages = await prisma.websitePage.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { orderIndex: 'asc' }
    });

    sendResponse(res, 200, 'Tenant pages retrieved', pages);
  } catch (err) {
    next(err);
  }
});

// Admin: Create or update a CMS page
router.post('/admin/pages', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { title, slug, content, seoTitle, seoDescription, isPublished, orderIndex } = req.body;
    const tenantId = req.tenantId!;

    if (!title) {
      return next(new AppError('Page title is required', 400));
    }

    const website = await prisma.website.findFirst({
      where: { tenantId }
    });

    if (!website) {
      return next(new AppError('Tenant website record not found', 404));
    }

    const cleanSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/^-+|-+$/g, '');

    const page = await prisma.websitePage.upsert({
      where: {
        tenantId_slug: { tenantId, slug: cleanSlug }
      },
      update: {
        title,
        content: content || {},
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || '',
        isPublished: isPublished !== undefined ? isPublished : true,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : 0
      },
      create: {
        tenantId,
        websiteId: website.id,
        title,
        slug: cleanSlug,
        content: content || {},
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || '',
        isPublished: isPublished !== undefined ? isPublished : true,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : 0
      }
    });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'WEBSITE_PAGE_SAVED',
      entityType: 'PAGE',
      entityId: page.id,
      newValue: { title, slug: cleanSlug, isPublished }
    });

    sendResponse(res, 200, 'Page saved successfully', page);
  } catch (err) {
    next(err);
  }
});

// Admin: Delete a CMS page
router.delete('/admin/pages/:id', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const page = await prisma.websitePage.findUnique({ where: { id } });
    if (!page) {
      return next(new AppError('Page not found', 404));
    }

    if (page.tenantId !== tenantId) {
      return next(new AppError('Forbidden: Page belongs to another tenant', 403));
    }

    await prisma.websitePage.delete({ where: { id } });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'WEBSITE_PAGE_DELETED',
      entityType: 'PAGE',
      entityId: id,
      oldValue: { title: page.title, slug: page.slug }
    });

    sendResponse(res, 200, 'Page deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
