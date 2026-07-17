import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { BookingService } from '../services/booking.service';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';

export class BookingController {
  static async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const booking = await BookingService.createBooking(req.user.id, req.body);
      sendResponse(res, 201, 'Booking requested successfully', booking);
    } catch (err) {
      next(err);
    }
  }

  static async assignWorker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      const booking = await BookingService.assignWorker(id, workerId);
      sendResponse(res, 200, 'Technician assigned and dispatched', booking);
    } catch (err) {
      next(err);
    }
  }

  static async getTenantBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.tenantId) throw new AppError('Tenant context required', 400);
      const bookings = await BookingService.getTenantBookings(req.user.tenantId);
      sendResponse(res, 200, 'Bookings retrieved successfully', bookings);
    } catch (err) {
      next(err);
    }
  }
}
