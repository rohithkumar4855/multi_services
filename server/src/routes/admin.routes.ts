import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, authorize, AuthenticatedRequest } from '../middlewares/auth';
import { tenantContextMiddleware } from '../middlewares/tenant';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';

const router = Router();
router.use(authenticate);
router.use(tenantContextMiddleware);

// 1. SERVICES CRUD
router.post('/services', authorize('TENANT_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.service.create({
      data: {
        tenantId: req.user!.tenantId!,
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        basePrice: Number(req.body.basePrice),
        durationMin: Number(req.body.durationMin),
        isActive: req.body.isActive ?? true
      }
    });
    sendResponse(res, 201, 'Service created successfully', service);
  } catch (err) { next(err); }
});

router.put('/services/:id', authorize('TENANT_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, 200, 'Service updated successfully', service);
  } catch (err) { next(err); }
});

// 2. WORKERS CRUD
router.get('/workers', authorize('TENANT_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { tenantId: req.user!.tenantId! },
      include: { user: { select: { name: true, email: true } } }
    });
    sendResponse(res, 200, 'Workers retrieved successfully', workers);
  } catch (err) { next(err); }
});

// 3. TENANT CONFIG UPDATES
router.put('/tenant/config', authorize('TENANT_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.user!.tenantId! },
      data: { config: req.body }
    });
    sendResponse(res, 200, 'Tenant configuration saved', tenant);
  } catch (err) { next(err); }
});

export default router;
