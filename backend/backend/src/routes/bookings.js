const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validation');

// POST /api/bookings - Create booking
router.post('/',
  authMiddleware,
  authorize('carrier'),
  validators.createBooking,
  handleValidationErrors,
  bookingController.createBooking
);

// GET /api/bookings - Get all bookings
router.get('/',
  authMiddleware,
  bookingController.getAllBookings
);

// GET /api/bookings/:id - Get single booking
router.get('/:id',
  authMiddleware,
  bookingController.getBooking
);

// GET /api/bookings/carrier/:carrierId - Get carrier's bookings
router.get('/carrier/:carrierId',
  authMiddleware,
  bookingController.getCarrierBookings
);

// PUT /api/bookings/:id/accept - Accept booking
router.put('/:id/accept',
  authMiddleware,
  authorize('carrier', 'admin'),
  bookingController.acceptBooking
);

// PUT /api/bookings/:id/decline - Decline booking
router.put('/:id/decline',
  authMiddleware,
  authorize('carrier', 'admin'),
  bookingController.declineBooking
);

// PUT /api/bookings/:id/complete - Complete booking
router.put('/:id/complete',
  authMiddleware,
  authorize('carrier', 'admin'),
  bookingController.completeBooking
);

module.exports = router;