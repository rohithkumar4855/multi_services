import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();

// Create booking (Public / Guest & Authenticated)
router.post('/', BookingController.createBooking);

// Get bookings (optionally filtered by tenantId or customerId)
router.get('/', BookingController.getTenantBookings);

// Update status
router.put('/:id/status', BookingController.updateBookingStatus);
router.patch('/:id/status', BookingController.updateBookingStatus);

// Assign worker
router.post('/:id/assign', BookingController.assignWorker);

export default router;
