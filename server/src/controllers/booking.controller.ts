import { Response, NextFunction } from 'express';
import { TenantRequest } from '../middlewares/tenant';
import { BookingService } from '../services/booking.service';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';

export class BookingController {
  static async createBooking(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.db) throw new AppError('Unauthorized', 401);
      
      // Execute through the RLS transaction context
      const booking = await req.db.run(async (tx) => {
        return await BookingService.createBooking(req.user!.id, req.body, tx);
      });
      
      sendResponse(res, 201, 'Booking requested successfully', booking);
    } catch (err) {
      next(err);
    }
  }

  static async assignWorker(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      if (!req.db) throw new AppError('Tenant database context required', 400);

      const booking = await req.db.run(async (tx) => {
        return await BookingService.assignWorker(id, workerId, tx);
      });
      
      sendResponse(res, 200, 'Technician assigned and dispatched', booking);
    } catch (err) {
      next(err);
    }
  }

  static async getTenantBookings(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.tenantId || !req.db) throw new AppError('Tenant context required', 400);
      
      const bookings = await req.db.run(async (tx) => {
        return await BookingService.getTenantBookings(req.user!.tenantId!, tx);
      });
      
      sendResponse(res, 200, 'Bookings retrieved successfully', bookings);
    } catch (err) {
      next(err);
    }
  }
}
