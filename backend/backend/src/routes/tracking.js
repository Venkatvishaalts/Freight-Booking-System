const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validation');

// POST /api/tracking - Add tracking update
router.post('/',
  authMiddleware,
  authorize('carrier', 'admin'),
  validators.createTracking,
  handleValidationErrors,
  trackingController.addTracking
);

// GET /api/tracking/:shipmentId - Get tracking history
router.get('/:shipmentId',
  authMiddleware,
  trackingController.getTrackingHistory
);

// GET /api/tracking/:shipmentId/live - Get live location
router.get('/:shipmentId/live',
  authMiddleware,
  trackingController.getLiveLocation
);

module.exports = router;