import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { AuditService } from './audit.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface CreateOrderInput {
  tenantId: string;
  userId?: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    type?: 'service' | 'product';
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  notes?: string;
  paymentMethod?: string;
}

export class OrderService {
  /**
   * Generates a unique, tenant-isolated order number.
   * e.g., "ORD-APEX-1001"
   */
  static async generateOrderNumber(tenantId: string): Promise<string> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const prefix = (tenant?.slug || 'TX').toUpperCase().slice(0, 5).replace(/[^A-Z0-9]/g, '');
    const count = await prisma.order.count({ where: { tenantId } });
    const orderSeq = 1000 + count + 1;
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${prefix}-${orderSeq}-${randomSuffix}`;
  }

  /**
   * Creates a new order isolated strictly to the given tenantId.
   */
  static async createOrder(input: CreateOrderInput, ipAddress?: string, userAgent?: string) {
    const {
      tenantId,
      userId,
      items,
      subtotal,
      tax = 0,
      discount = 0,
      total,
      customerDetails,
      notes
    } = input;

    if (!tenantId) {
      throw new AppError('Tenant ID is required for order creation', 400);
    }
    if (!items || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }
    if (!customerDetails || !customerDetails.name || !customerDetails.phone) {
      throw new AppError('Customer name and phone number are required', 400);
    }

    const orderNumber = await this.generateOrderNumber(tenantId);

    // If userId not provided, check or create customer user under this tenant
    let effectiveUserId = userId;
    if (!effectiveUserId && customerDetails.email) {
      const cleanEmail = customerDetails.email.toLowerCase().trim();
      let customer = await prisma.user.findFirst({
        where: { tenantId, email: cleanEmail }
      });

      if (!customer) {
        customer = await prisma.user.create({
          data: {
            tenantId,
            name: customerDetails.name,
            email: cleanEmail,
            phone: customerDetails.phone,
            passwordHash: 'guest-no-direct-login',
            role: 'CUSTOMER'
          }
        });
      }
      effectiveUserId = customer.id;
    }

    const order = await prisma.order.create({
      data: {
        tenantId,
        userId: effectiveUserId || null,
        orderNumber,
        items,
        subtotal: Number(subtotal),
        tax: Number(tax),
        discount: Number(discount),
        total: Number(total),
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.CONFIRMED,
        customerDetails,
        notes
      }
    });

    // Also record lead/CRM entry if tenant lead doesn't exist
    const existingLead = await prisma.lead.findFirst({
      where: { tenantId, phone: customerDetails.phone }
    });
    if (!existingLead) {
      await prisma.lead.create({
        data: {
          tenantId,
          name: customerDetails.name,
          phone: customerDetails.phone,
          email: customerDetails.email || '',
          serviceInterest: items.map(i => i.name).join(', '),
          notes: `Placed order ${orderNumber} for amount $${total}`,
          status: 'contacted'
        }
      });
    }

    // Create Notification for Tenant Admin
    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: 'TENANT_ADMIN' }
    });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          tenantId,
          recipientId: adminUser.id,
          type: 'order',
          title: `New Order Received: #${orderNumber}`,
          message: `${customerDetails.name} placed an order worth $${total.toFixed(2)}.`,
          data: { orderId: order.id, orderNumber }
        }
      });
    }

    await AuditService.log({
      tenantId,
      userId: effectiveUserId || null,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      newValue: { orderNumber, total, itemsCount: items.length },
      ipAddress,
      userAgent
    });

    return order;
  }

  /**
   * Retrieves orders isolated to the current tenant.
   */
  static async getTenantOrders(tenantId: string, options: { status?: string; limit?: number; offset?: number } = {}) {
    const { status, limit = 50, offset = 0 } = options;

    return await prisma.order.findMany({
      where: {
        tenantId,
        ...(status && { orderStatus: status as any })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        payments: true
      }
    });
  }

  /**
   * Retrieves a single order. Verifies strict tenant isolation.
   */
  static async getOrderById(orderId: string, tenantId: string, isSuperAdmin: boolean = false) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!isSuperAdmin && order.tenantId !== tenantId) {
      throw new AppError('Forbidden: Resource belongs to another tenant', 403);
    }

    return order;
  }

  /**
   * Updates order status with strict tenant validation and audit logging.
   */
  static async updateOrderStatus(orderId: string, tenantId: string, newStatus: OrderStatus, userId?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (order.tenantId !== tenantId) {
      throw new AppError('Forbidden: Unauthorized tenant access', 403);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: newStatus }
    });

    await AuditService.log({
      tenantId,
      userId,
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'ORDER',
      entityId: orderId,
      oldValue: { orderStatus: order.orderStatus },
      newValue: { orderStatus: newStatus }
    });

    return updated;
  }
}
