const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // your auth middleware
const {
  createBooking,
  getMyBookings,
  getBooking,
  updateBookingStatus,
  confirmBooking,
  startBooking,
  completeBooking,
  rateTechnician,
  cancelBooking,
  confirmPayment,              // ✅ NEW import
} = require('../controllers/bookingratingController');

// All booking routes require authentication
router.use(auth);

// Create booking (client)
router.post('/', createBooking);

// Get user's bookings (client or technician)
router.get('/my-bookings', getMyBookings);

// Get single booking
router.get('/:bookingId', getBooking);

// Update status (generic – but with permission checks)
router.patch('/:bookingId/status', updateBookingStatus);

// Confirm booking (technician)
router.post('/:bookingId/confirm', confirmBooking);

// Start booking (technician)
router.post('/:bookingId/start', startBooking);

// Complete booking (client or technician)
router.post('/:bookingId/complete', completeBooking);

// Rate technician (client only, after completion)
router.post('/:bookingId/rate', rateTechnician);

// Cancel booking (client or technician)
router.post('/:bookingId/cancel', cancelBooking);

// ✅ NEW: Confirm payment (technician only, when job is in progress)
router.post('/:bookingId/confirm-payment', confirmPayment);

module.exports = router;