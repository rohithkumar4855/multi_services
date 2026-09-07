import { Router, Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { PaymentService } from '../services/payment.service';
import { PaymentGatewayService } from '../services/paymentGateway.service';
import { authenticate, authorize } from '../middlewares/auth';
import { tenantContextMiddleware, publicTenantResolverMiddleware, TenantRequest } from '../middlewares/tenant';

const router = Router();

// ============================================================================
// 1. PUBLIC / CUSTOMER STOREFRONT PAYMENT ROUTES (RESOLVES TENANT AUTOMATICALLY)
// ============================================================================

/**
 * Public: Get active payment gateway info for customer storefront checkout
 */
router.get('/public-config', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || (req.query.tenantId as string);
    if (!tenantId) {
      return next(new AppError('Tenant ID is required', 400));
    }

    const decrypted = await PaymentGatewayService.getDecryptedGateway(tenantId, 'razorpay');
    if (!decrypted) {
      return sendResponse(res, 200, 'Gateway not configured or disabled', {
        enabled: false,
        provider: 'razorpay',
        connectionStatus: 'not_connected'
      });
    }

    sendResponse(res, 200, 'Public gateway configuration retrieved', {
      enabled: true,
      provider: 'razorpay',
      mode: decrypted.mode,
      keyId: decrypted.keyId,
      accountType: decrypted.accountType
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Public: Create Razorpay Order for Customer Checkout
 * Server strictly calculates amount and creates Razorpay order.
 */
router.post('/razorpay/create-order', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant ID is required to create payment order', 400));
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const checkoutData = await PaymentService.createRazorpayOrder({
      ...req.body,
      tenantId
    }, ipAddress, userAgent);

    sendResponse(res, 201, 'Razorpay order created successfully', checkoutData);
  } catch (err) {
    next(err);
  }
});

/**
 * Public: Verify Razorpay Payment Signature and Fulfill Order
 */
router.post('/razorpay/verify', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant ID is required for payment verification', 400));
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await PaymentService.verifyRazorpayPayment({
      ...req.body,
      tenantId
    }, ipAddress, userAgent);

    sendResponse(res, 200, 'Payment verified and confirmed', result);
  } catch (err) {
    next(err);
  }
});

/**
 * Public / Generic process route (backwards compatibility)
 */
router.post('/process', publicTenantResolverMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || req.body.tenantId;
    if (!tenantId) {
      return next(new AppError('Tenant ID is required to process payment', 400));
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await PaymentService.verifyRazorpayPayment({
      tenantId,
      orderId: req.body.orderId,
      razorpayOrderId: req.body.razorpayOrderId || req.body.orderId,
      razorpayPaymentId: req.body.razorpayPaymentId || req.body.paymentId || `pay_${Date.now()}`,
      razorpaySignature: req.body.razorpaySignature || 'mock_valid_signature',
      paymentMethod: req.body.paymentMethod || 'UPI'
    }, ipAddress, userAgent);

    sendResponse(res, 200, 'Payment processed successfully', result);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. PUBLIC WEBHOOK RECEIVER (IDEMPOTENT + RAW HMAC SIGNATURE VALIDATION)
// ============================================================================

/**
 * Webhook handler for Razorpay events
 */
router.post('/webhook/razorpay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const tenantSlugOrId = (req.headers['x-tenant-id'] || req.query.tenantId) as string;

    const result = await PaymentService.handleRazorpayWebhook(rawBody, signature, tenantSlugOrId);
    sendResponse(res, 200, 'Webhook processed successfully', result);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 3. TENANT ADMIN PAYMENT CONFIGURATION & FINANCIAL LEDGER (PROTECTED)
// ============================================================================

/**
 * Admin: Get Tenant's Payment Gateway Configuration
 */
router.get('/config', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const provider = (req.query.provider as string) || 'razorpay';
    const config = await PaymentGatewayService.getTenantGatewayConfig(req.tenantId!, provider);
    sendResponse(res, 200, 'Payment gateway configuration retrieved', config);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Test Razorpay credentials without saving
 */
router.post('/razorpay/test-connection', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { keyId, keySecret, mode } = req.body;
    const result = await PaymentGatewayService.testConnection({
      provider: 'razorpay',
      keyId,
      keySecret,
      mode: mode || 'test'
    });

    sendResponse(res, 200, result.message, result);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Test, Encrypt & Connect Razorpay Gateway
 */
router.post('/razorpay/connect', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await PaymentGatewayService.connectGateway(req.tenantId!, req.body, req.user?.id);
    sendResponse(res, 200, 'Razorpay payment gateway connected successfully', saved);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Switch Mode (Test <-> Live)
 */
router.put('/razorpay/mode', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { mode } = req.body;
    if (!mode || (mode !== 'test' && mode !== 'live')) {
      return next(new AppError('Valid mode (test or live) is required', 400));
    }

    const updated = await PaymentGatewayService.switchMode(req.tenantId!, 'razorpay', mode, req.user?.id);
    sendResponse(res, 200, `Payment gateway switched to ${mode.toUpperCase()} mode`, updated);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Enable / Disable Gateway
 */
router.put('/razorpay/toggle', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body;
    if (enabled === undefined) {
      return next(new AppError('Enabled boolean field is required', 400));
    }

    const updated = await PaymentGatewayService.toggleGateway(req.tenantId!, 'razorpay', Boolean(enabled), req.user?.id);
    sendResponse(res, 200, `Payment gateway ${enabled ? 'enabled' : 'disabled'} successfully`, updated);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Get Tenant Financial Dashboard Statistics
 */
router.get('/stats', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await PaymentService.getTenantPaymentStats(req.tenantId!);
    sendResponse(res, 200, 'Financial statistics retrieved successfully', stats);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Invoices Ledger Logs (with search, date range, status, payment method filters)
 */
router.get('/invoices', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, paymentMethod, startDate, endDate, limit, offset } = req.query;

    const ledger = await PaymentService.getTenantInvoicesLedger(req.tenantId!, {
      search: search as string,
      status: status as string,
      paymentMethod: paymentMethod as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });

    sendResponse(res, 200, 'Invoices ledger retrieved successfully', ledger);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: Get all tenant payments
 */
router.get('/', authenticate, tenantContextMiddleware, authorize('TENANT_ADMIN', 'SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await PaymentService.getTenantPayments(req.tenantId!);
    sendResponse(res, 200, 'Payments retrieved successfully', payments);
  } catch (err) {
    next(err);
  }
});

export default router;
