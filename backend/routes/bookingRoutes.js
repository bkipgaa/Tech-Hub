const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // your auth middleware
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
} = require('../controllers/bookingController');

// All booking routes require authentication
router.use(protect);

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

module.exports = router;