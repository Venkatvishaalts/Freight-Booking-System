const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validation');

// POST /api/shipments - Create new shipment
router.post('/',
  authMiddleware,
  validators.createShipment,
  handleValidationErrors,
  shipmentController.createShipment
);

// GET /api/shipments - Get all shipments
router.get('/',
  authMiddleware,
  shipmentController.getAllShipments
);

// GET /api/shipments/:id - Get single shipment
router.get('/:id',
  authMiddleware,
  shipmentController.getShipment
);

// GET /api/shipments/shipper/:shipperId - Get shipper's shipments
router.get('/shipper/:shipperId',
  authMiddleware,
  shipmentController.getShipperShipments
);

// PUT /api/shipments/:id - Update shipment
router.put('/:id',
  authMiddleware,
  shipmentController.updateShipment
);

// PUT /api/shipments/:id/cancel - Cancel shipment
router.put('/:id/cancel',
  authMiddleware,
  shipmentController.cancelShipment
);

module.exports = router;