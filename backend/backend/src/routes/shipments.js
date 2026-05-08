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

// GET /api/shipments/shipper/:shipperId - Get shipper's shipments
router.get('/shipper/:shipperId',
  authMiddleware,
  shipmentController.getShipperShipments
);

// GET /api/shipments/carrier/:carrierId - Get carrier's shipments
router.get('/carrier/:carrierId',
  authMiddleware,
  shipmentController.getCarrierShipments
);

// GET /api/shipments/:id - Get single shipment
router.get('/:id',
  authMiddleware,
  shipmentController.getShipment
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

// PATCH /api/shipments/:id/complete - Complete delivery
router.patch('/:id/complete',
  authMiddleware,
  shipmentController.completeShipment
);

module.exports = router;