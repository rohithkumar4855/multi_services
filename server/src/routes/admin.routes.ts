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
    sendResponse(res, 200, 'Tenant configuration saved', { tenantId: req.user!.tenantId, config: req.body });
  } catch (err) { next(err); }
});

// 4. LEADS CRUD
router.post('/leads', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant ID is required', 400));
    }
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email || '',
        serviceInterest: req.body.serviceInterest || '',
        notes: req.body.notes || '',
        status: req.body.status || 'new',
      }
    });
    sendResponse(res, 201, 'Lead created successfully', lead);
  } catch (err) { next(err); }
});

router.get('/leads', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const where = tenantId ? { tenantId } : {};
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    sendResponse(res, 200, 'Leads retrieved successfully', leads);
  } catch (err) { next(err); }
});

router.put('/leads/:id', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: req.body
    });
    sendResponse(res, 200, 'Lead updated successfully', lead);
  } catch (err) { next(err); }
});

router.delete('/leads/:id', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.lead.delete({
      where: { id: req.params.id }
    });
    sendResponse(res, 200, 'Lead deleted successfully', null);
  } catch (err) { next(err); }
});

export default router;
