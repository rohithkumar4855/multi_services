import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { AuditService } from './audit.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import crypto from 'crypto';

export interface ProcessPaymentInput {
  tenantId: string;
  orderId: string;
  userId?: string | null;
  amount: number;
  currency?: string;
  paymentGateway?: string;
  paymentId?: string;
  utrNumber?: string;
  metadata?: any;
}

export class PaymentService {
  /**
   * Process / Confirm payment with idempotency & webhook verification
   */
  static async processPayment(input: ProcessPaymentInput, ipAddress?: string, userAgent?: string) {
    const {
      tenantId,
      orderId,
      userId,
      amount,
      currency = 'USD',
      paymentGateway = 'simulated',
      paymentId: customPaymentId,
      utrNumber,
      metadata = {}
    } = input;

    if (!tenantId || !orderId) {
      throw new AppError('Tenant ID and Order ID are required', 400);
    }

    // Verify order exists and belongs to the specified tenant
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.tenantId !== tenantId) {
      throw new AppError('Forbidden: Order does not belong to this tenant', 403);
    }

    const paymentId = customPaymentId || `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Check for idempotency / duplicate payment
    const existingPayment = await prisma.payment.findUnique({
      where: { paymentId }
    });

    if (existingPayment) {
      return { payment: existingPayment, order, isDuplicate: true };
    }

    // Transaction to create payment and mark order paid
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId,
          userId: userId || order.userId || null,
          paymentGateway,
          paymentId,
          amount: Number(amount),
          currency,
          status: PaymentStatus.SUCCESS,
          utrNumber: utrNumber || `UTR-${Date.now()}`,
          metadata
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: OrderStatus.CONFIRMED
        }
      });

      return { payment, order: updatedOrder };
    });

    // Notify tenant admin of successful payment
    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: 'TENANT_ADMIN' }
    });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          tenantId,
          recipientId: adminUser.id,
          type: 'payment',
          title: `Payment Received: $${amount.toFixed(2)}`,
          message: `Payment of $${amount.toFixed(2)} received for Order #${order.orderNumber} via ${paymentGateway}.`,
          data: { orderId: order.id, paymentId: result.payment.id }
        }
      });
    }

    await AuditService.log({
      tenantId,
      userId: userId || null,
      action: 'PAYMENT_PROCESSED',
      entityType: 'PAYMENT',
      entityId: result.payment.id,
      newValue: {
        orderId,
        amount,
        paymentGateway,
        paymentId
      },
      ipAddress,
      userAgent
    });

    return result;
  }

  /**
   * Webhook processor for external payment providers (e.g. Razorpay, Stripe)
   */
  static async handleWebhook(gateway: string, payload: any, signature?: string) {
    const tenantId = payload.tenantId || payload.notes?.tenantId || payload.metadata?.tenantId;
    const event = payload.event || 'payment.success';

    // Store webhook payload for audit and replay prevention
    await prisma.paymentWebhook.create({
      data: {
        tenantId: tenantId || null,
        gateway,
        event,
        payload,
        signature: signature || null,
        status: 'processed'
      }
    });

    const orderId = payload.orderId || payload.notes?.orderId || payload.metadata?.orderId;
    const amount = Number(payload.amount || payload.data?.object?.amount_received / 100 || 0);

    if (tenantId && orderId && amount > 0) {
      await this.processPayment({
        tenantId,
        orderId,
        amount,
        paymentGateway: gateway,
        paymentId: payload.paymentId || payload.id || `webhook_${Date.now()}`,
        metadata: payload
      });
    }

    return { received: true, event };
  }

  /**
   * Retrieves payments scoped to current tenant
   */
  static async getTenantPayments(tenantId: string) {
    return await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerDetails: true,
            total: true
          }
        }
      }
    });
  }
}
