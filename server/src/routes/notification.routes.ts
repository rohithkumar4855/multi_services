import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { authenticate } from '../middlewares/auth';
import { tenantContextMiddleware, TenantRequest } from '../middlewares/tenant';

const router = Router();

// Get tenant notifications
router.get('/', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    sendResponse(res, 200, 'Notifications retrieved', notifications);
  } catch (err) {
    next(err);
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }
    if (notification.tenantId !== req.tenantId!) {
      return next(new AppError('Forbidden: Notification belongs to another tenant', 403));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readStatus: true }
    });

    sendResponse(res, 200, 'Notification marked as read', updated);
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put('/read-all', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { tenantId: req.tenantId!, readStatus: false },
      data: { readStatus: true }
    });

    sendResponse(res, 200, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
});

export default router;
