import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, authorize, AuthenticatedRequest } from '../middlewares/auth';
import { tenantContextMiddleware } from '../middlewares/tenant';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { gstinSchema } from '../utils/validators';

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
      include: { user: { select: { name: true, email: true, phone: true } } }
    });
    sendResponse(res, 200, 'Workers retrieved successfully', workers);
  } catch (err) { next(err); }
});

router.post('/workers', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant ID is required', 400));
    }
    
    // Create a user for the worker first
    const workerEmail = req.body.email || `worker_${Date.now()}@tenant${tenantId}.com`;
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: workerEmail,
        passwordHash: 'Worker@Password123', // Default placeholder
        role: 'WORKER',
        tenantId,
        phone: req.body.phone
      }
    });

    const worker = await prisma.worker.create({
      data: {
        userId: user.id,
        tenantId,
        skills: req.body.skills || [],
        availability: req.body.availability || 'available',
        aadhaarValid: req.body.aadhaarStatus === 'verified',
      }
    });

    sendResponse(res, 201, 'Worker created successfully', { ...worker, user: { name: user.name, phone: user.phone, email: user.email } });
  } catch (err) { next(err); }
});

// 3. TENANT CONFIG UPDATES
router.put('/tenant/config', authorize('TENANT_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { gstNumber, businessName, ...configData } = req.body;

    if (gstNumber) {
      const gstinResult = gstinSchema.safeParse(gstNumber);
      if (!gstinResult.success) {
        return next(new AppError('Please enter a valid 15-character GSTIN.', 400));
      }
    }

    const tenantId = req.user!.tenantId!;
    const { TenantService } = await import('../services/tenant.service');
    const updated = await TenantService.updateTenantConfig(tenantId, {
      name: businessName,
      gstNumber,
      config: configData
    }, req.user!.id);

    sendResponse(res, 200, 'Tenant configuration saved', updated);
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

// 5. SERVICES CRUD
router.get('/services', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId!;
    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
    sendResponse(res, 200, 'Services retrieved successfully', services);
  } catch (err) { next(err); }
});

router.post('/services', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { name, category, description, icon, basePrice, durationMin, isActive } = req.body;
    
    if (!name || !category || basePrice === undefined || durationMin === undefined) {
      return next(new AppError('Missing required service fields', 400));
    }

    const service = await prisma.service.create({
      data: {
        tenantId,
        name,
        category,
        description: description || '',
        icon: icon || '🔧',
        basePrice: Number(basePrice),
        durationMin: Number(durationMin),
        isActive: isActive !== undefined ? isActive : true
      }
    });
    sendResponse(res, 201, 'Service created successfully', service);
  } catch (err) { next(err); }
});

router.put('/services/:id', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId!;
    const serviceId = req.params.id;
    const { name, category, description, icon, basePrice, durationMin, isActive } = req.body;
    
    // Ensure the service belongs to the tenant
    const existing = await prisma.service.findFirst({
      where: { id: serviceId, tenantId }
    });
    
    if (!existing) {
      return next(new AppError('Service not found or unauthorized', 404));
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: name !== undefined ? name : existing.name,
        category: category !== undefined ? category : existing.category,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
        durationMin: durationMin !== undefined ? Number(durationMin) : existing.durationMin,
        isActive: isActive !== undefined ? isActive : existing.isActive
      }
    });
    
    sendResponse(res, 200, 'Service updated successfully', service);
  } catch (err) { next(err); }
});

export default router;
