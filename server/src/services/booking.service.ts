import { prisma } from '../config/db';
import { AppError } from '../utils/errors';

export class BookingService {
  static async createBooking(userId: string, data: any) {
    // Validate service exists
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new AppError('Service not found', 404);

    // Business rule: Pricing calculation
    const basePrice = service.basePrice;
    const tax = basePrice * 0.18; // 18% GST standard rule
    const total = basePrice + tax;

    // Open transaction to save database changes
    return await prisma.$transaction(async (tx) => {
      return await tx.booking.create({
        data: {
          tenantId: service.tenantId,
          customerId: userId,
          serviceId: service.id,
          status: 'REQUESTED',
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          priceTotal: basePrice,
          taxTotal: tax,
          discountTotal: 0.0,
          netTotal: total,
          formData: data.formData || {}
        }
      });
    });
  }

  static async assignWorker(bookingId: string, workerId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError('Booking not found', 404);

    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) throw new AppError('Worker not found', 404);

    if (worker.availability !== 'available') {
      throw new AppError('Worker is currently unavailable for dispatch', 400);
    }

    return await prisma.$transaction(async (tx) => {
      // Assign worker and set their status to active on job
      await tx.worker.update({
        where: { id: workerId },
        data: { availability: 'busy' }
      });

      return await tx.booking.update({
        where: { id: bookingId },
        data: {
          workerId,
          status: 'ASSIGNED'
        }
      });
    });
  }

  static async getTenantBookings(tenantId: string) {
    return await prisma.booking.findMany({
      where: { tenantId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: true,
        worker: { include: { user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
