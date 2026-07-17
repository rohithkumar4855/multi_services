import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { createBookingSchema, assignWorkerSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('CUSTOMER', 'TENANT_ADMIN'),
  validateRequest(createBookingSchema),
  BookingController.createBooking
);

router.post(
  '/:id/assign',
  authorize('TENANT_ADMIN'),
  validateRequest(assignWorkerSchema),
  BookingController.assignWorker
);

router.get(
  '/',
  authorize('TENANT_ADMIN'),
  BookingController.getTenantBookings
);

export default router;
