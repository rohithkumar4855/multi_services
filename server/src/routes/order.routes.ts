import { Router, Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { OrderService } from '../services/order.service';
import { authenticate } from '../middlewares/auth';
import { tenantContextMiddleware, publicTenantResolverMiddleware, TenantRequest } from '../middlewares/tenant';
import { OrderStatus } from '@prisma/client';

const router = Router();

// Public / Customer Checkout: Place an order on a tenant website
router.post('/', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant identifier required to place order', 400));
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const order = await OrderService.createOrder({
      ...req.body,
      tenantId
    }, ipAddress, userAgent);

    sendResponse(res, 201, 'Order created successfully', order);
  } catch (err) {
    next(err);
  }
});

// Admin: Get all tenant orders
router.get('/', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { status, limit, offset } = req.query;
    const orders = await OrderService.getTenantOrders(req.tenantId!, {
      status: status as string,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });

    sendResponse(res, 200, 'Orders retrieved successfully', orders);
  } catch (err) {
    next(err);
  }
});

// Get single order with strict tenant isolation check
router.get('/:id', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const order = await OrderService.getOrderById(id, req.tenantId!, isSuperAdmin);

    sendResponse(res, 200, 'Order retrieved successfully', order);
  } catch (err) {
    next(err);
  }
});

// Admin: Update order status
router.put('/:id/status', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return next(new AppError('Order status is required', 400));
    }

    const updated = await OrderService.updateOrderStatus(
      id,
      req.tenantId!,
      status.toUpperCase() as OrderStatus,
      req.user?.id
    );

    sendResponse(res, 200, 'Order status updated successfully', updated);
  } catch (err) {
    next(err);
  }
});

export default router;
