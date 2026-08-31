import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import bcrypt from 'bcryptjs';

export class BookingService {
  static async createBooking(userIdOrNull: string | null, data: any, tx?: any) {
    const client = tx || prisma;
    const {
      tenantId,
      serviceId,
      serviceName,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      scheduledDate,
      scheduledTime,
      priceDetails,
      formData,
      isEmergency,
      notes
    } = data;

    if (!tenantId) {
      throw new AppError('Tenant ID is required to create a booking', 400);
    }

    // 1. Resolve Customer User
    let customerId = userIdOrNull;
    const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (customerEmail && customerEmail.includes('@')) 
      ? customerEmail.toLowerCase().trim() 
      : (cleanPhone ? `cust_${cleanPhone}@tenant-${tenantId}.local` : `guest_${Date.now()}@tenant-${tenantId}.local`);

    if (!customerId) {
      let existingUser = await client.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            ...(cleanPhone ? [{ email: { contains: cleanPhone } }] : [])
          ]
        }
      });

      if (!existingUser) {
        const passwordHash = await bcrypt.hash('customer123', 10);
        existingUser = await client.user.create({
          data: {
            email: cleanEmail,
            passwordHash,
            name: customerName || 'Valued Customer',
            role: 'CUSTOMER',
            tenantId
          }
        });
      }
      customerId = existingUser.id;
    }

    // 2. Resolve Service
    let targetService = serviceId ? await client.service.findFirst({
      where: {
        OR: [
          { id: serviceId },
          { name: serviceName || serviceId, tenantId }
        ]
      }
    }) : null;

    if (!targetService) {
      // Find any service for this tenant or create a default
      targetService = await client.service.findFirst({ where: { tenantId } });
      if (!targetService) {
        targetService = await client.service.create({
          data: {
            tenantId,
            name: serviceName || 'General Maintenance Service',
            category: 'General',
            description: 'Customer requested doorstep service visit.',
            icon: '🔧',
            basePrice: priceDetails?.baseVisit || 350,
            durationMin: 60,
            isActive: true
          }
        });
      }
    }

    // 3. Pricing Calculation
    const basePrice = priceDetails?.baseVisit || targetService.basePrice || 350;
    const tax = priceDetails?.tax !== undefined ? priceDetails.tax : Math.round(basePrice * 0.18);
    const discount = priceDetails?.discount || 0;
    const netTotal = priceDetails?.total || (basePrice + tax - discount + 150);

    const bookingPayloadFormData = {
      ...(formData || {}),
      customerName: customerName || '',
      customerPhone: cleanPhone || '',
      customerAddress: customerAddress || '',
      serviceName: serviceName || targetService.name,
      isEmergency: !!isEmergency,
      notes: notes || formData?.notes || ''
    };

    // 4. Create Booking in PostgreSQL DB
    const booking = await client.booking.create({
      data: {
        tenantId,
        customerId,
        serviceId: targetService.id,
        status: 'REQUESTED',
        scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: scheduledTime || '10:00 AM',
        priceTotal: basePrice,
        taxTotal: tax,
        discountTotal: discount,
        netTotal,
        formData: bookingPayloadFormData
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: true,
        worker: { include: { user: { select: { name: true } } } }
      }
    });

    // 5. Automatically create or update a Lead in DB
    if (cleanPhone || customerName) {
      try {
        const existingLead = await client.lead.findFirst({
          where: { phone: cleanPhone, tenantId }
        });
        if (!existingLead) {
          await client.lead.create({
            data: {
              tenantId,
              name: customerName || 'Customer',
              phone: cleanPhone || '9876543210',
              email: customerEmail || '',
              serviceInterest: targetService.name,
              notes: `Booking #${booking.id.substring(0, 8)} scheduled on ${scheduledDate || 'today'} at ${scheduledTime || '10:00 AM'}. Address: ${customerAddress || 'Direct visit'}`,
              status: 'contacted'
            }
          });
        }
      } catch (leadErr) {
        console.error('Lead auto-creation error:', leadErr);
      }
    }

    return booking;
  }

  static async getTenantBookings(tenantId?: string, customerId?: string, tx?: any) {
    const client = tx || prisma;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (customerId) where.customerId = customerId;

    return await client.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: true,
        worker: { include: { user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateBookingStatus(bookingId: string, status: string, tx?: any) {
    const client = tx || prisma;
    const validStatuses = ['REQUESTED', 'ASSIGNED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'];
    const formattedStatus = status.toUpperCase().replace(/\s+/g, '_');
    
    return await client.booking.update({
      where: { id: bookingId },
      data: {
        status: validStatuses.includes(formattedStatus) ? formattedStatus : 'REQUESTED'
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: true,
        worker: { include: { user: { select: { name: true } } } }
      }
    });
  }

  static async assignWorker(bookingId: string, workerId: string, tx?: any) {
    const client = tx || prisma;

    const booking = await client.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError('Booking not found', 404);

    const worker = await client.worker.findUnique({ where: { id: workerId } });
    if (!worker) throw new AppError('Worker not found', 404);

    await client.worker.update({
      where: { id: workerId },
      data: { availability: 'busy' }
    });

    return await client.booking.update({
      where: { id: bookingId },
      data: {
        workerId,
        status: 'ASSIGNED'
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: true,
        worker: { include: { user: { select: { name: true } } } }
      }
    });
  }
}
