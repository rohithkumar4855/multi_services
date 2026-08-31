import { Router, Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { PaymentService } from '../services/payment.service';
import { authenticate } from '../middlewares/auth';
import { tenantContextMiddleware, publicTenantResolverMiddleware, TenantRequest } from '../middlewares/tenant';

const router = Router();

// Public / Customer Checkout: Process a payment
router.post('/process', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant ID is required to process payment', 400));
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await PaymentService.processPayment({
      ...req.body,
      tenantId
    }, ipAddress, userAgent);

    sendResponse(res, 200, 'Payment processed successfully', result);
  } catch (err) {
    next(err);
  }
});

// Payment Webhook Handler (Stripe / Razorpay / etc)
router.post('/webhook/:gateway', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gateway } = req.params;
    const signature = (req.headers['x-razorpay-signature'] || req.headers['stripe-signature']) as string;
    const result = await PaymentService.handleWebhook(gateway, req.body, signature);

    sendResponse(res, 200, 'Webhook received', result);
  } catch (err) {
    next(err);
  }
});

// Admin: Get all tenant payments
router.get('/', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await PaymentService.getTenantPayments(req.tenantId!);
    sendResponse(res, 200, 'Payments retrieved successfully', payments);
  } catch (err) {
    next(err);
  }
});

export default router;
