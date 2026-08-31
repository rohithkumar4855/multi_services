import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { authenticate } from '../middlewares/auth';
import { tenantContextMiddleware, publicTenantResolverMiddleware, TenantRequest } from '../middlewares/tenant';
import { AuditService } from '../services/audit.service';

const router = Router();

// Public / Storefront: Get products for tenant
router.get('/', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || (req.query.tenantId as string);
    if (!tenantId) {
      return next(new AppError('Tenant ID or domain required to list products', 400));
    }

    const products = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    sendResponse(res, 200, 'Products retrieved successfully', products);
  } catch (err) {
    next(err);
  }
});

// Admin: Get all products (active & inactive)
router.get('/admin', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' }
    });

    sendResponse(res, 200, 'Tenant products retrieved', products);
  } catch (err) {
    next(err);
  }
});

// Admin: Create product
router.post('/', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, compareAtPrice, stock, category, images, isActive } = req.body;
    const tenantId = req.tenantId!;

    if (!name || price === undefined) {
      return next(new AppError('Product name and price are required', 400));
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: name.trim(),
        description: description || '',
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        stock: stock !== undefined ? Number(stock) : 50,
        category: category || 'General',
        images: images || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product.id,
      newValue: { name: product.name, price: product.price }
    });

    sendResponse(res, 201, 'Product created successfully', product);
  } catch (err) {
    next(err);
  }
});

// Admin: Update product
router.put('/:id', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Product not found', 404));
    }
    if (existing.tenantId !== tenantId) {
      return next(new AppError('Forbidden: Product belongs to another tenant', 403));
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(req.body.name && { name: req.body.name.trim() }),
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.price !== undefined && { price: Number(req.body.price) }),
        ...(req.body.compareAtPrice !== undefined && { compareAtPrice: req.body.compareAtPrice ? Number(req.body.compareAtPrice) : null }),
        ...(req.body.stock !== undefined && { stock: Number(req.body.stock) }),
        ...(req.body.category && { category: req.body.category }),
        ...(req.body.images && { images: req.body.images }),
        ...(req.body.isActive !== undefined && { isActive: req.body.isActive })
      }
    });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: id,
      oldValue: existing,
      newValue: updated
    });

    sendResponse(res, 200, 'Product updated successfully', updated);
  } catch (err) {
    next(err);
  }
});

// Admin: Delete product
router.delete('/:id', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Product not found', 404));
    }
    if (existing.tenantId !== tenantId) {
      return next(new AppError('Forbidden: Product belongs to another tenant', 403));
    }

    await prisma.product.delete({ where: { id } });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: id,
      oldValue: { name: existing.name }
    });

    sendResponse(res, 200, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
