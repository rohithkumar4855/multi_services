import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { sendResponse } from '../utils/response';
import jwt from 'jsonwebtoken';

export class BookingController {
  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user token is attached
      let userId: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servos-super-secret-key-2026-anarav-tech') as any;
          userId = decoded?.id || null;
        } catch {}
      }

      const booking = await BookingService.createBooking(userId, req.body);
      sendResponse(res, 201, 'Booking created and saved to database successfully', booking);
    } catch (err) {
      next(err);
    }
  }

  static async getTenantBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.query.tenantId as string) || (req as any).user?.tenantId;
      const customerId = (req.query.customerId as string) || (req as any).user?.id;

      const bookings = await BookingService.getTenantBookings(tenantId, customerId);
      sendResponse(res, 200, 'Bookings retrieved successfully from database', bookings);
    } catch (err) {
      next(err);
    }
  }

  static async updateBookingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await BookingService.updateBookingStatus(id, status);
      sendResponse(res, 200, 'Booking status updated successfully in database', updated);
    } catch (err) {
      next(err);
    }
  }

  static async assignWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      const booking = await BookingService.assignWorker(id, workerId);
      sendResponse(res, 200, 'Technician assigned and saved to database', booking);
    } catch (err) {
      next(err);
    }
  }
}
