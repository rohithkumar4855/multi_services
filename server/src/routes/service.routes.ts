import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';

const router = Router();

// GET /api/services?tenantId=...
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.query.tenantId as string;
    const where: any = { isActive: true };
    if (tenantId) where.tenantId = tenantId;

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    sendResponse(res, 200, 'Services retrieved successfully from database', services);
  } catch (err) {
    next(err);
  }
});

// POST /api/services
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, name, category, description, icon, basePrice, durationMin, isActive } = req.body;
    if (!tenantId || !name) {
      return next(new AppError('tenantId and name are required', 400));
    }

    const service = await prisma.service.create({
      data: {
        tenantId,
        name,
        category: category || 'General',
        description: description || '',
        icon: icon || '🔧',
        basePrice: Number(basePrice) || 350,
        durationMin: Number(durationMin) || 45,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    sendResponse(res, 201, 'Service created and saved to database successfully', service);
  } catch (err) {
    next(err);
  }
});

// PUT /api/services/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, category, description, icon, basePrice, durationMin, isActive } = req.body;

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(durationMin !== undefined && { durationMin: Number(durationMin) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    sendResponse(res, 200, 'Service updated successfully in database', updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    sendResponse(res, 200, 'Service deleted successfully from database', null);
  } catch (err) {
    next(err);
  }
});

export default router;
