const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validation');

const sharedBookingController = require('../controllers/sharedBookingController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/vehicles/search - Search for available space (MUST BE BEFORE /:id)
router.get('/search', sharedBookingController.searchAvailableSpace);

// GET /api/vehicles/available - Get available vehicles
router.get('/available', vehicleController.getAvailableVehicles);

// POST /api/vehicles - Add a new vehicle
router.post('/',
  validators.createVehicle,
  handleValidationErrors,
  vehicleController.addVehicle
);

// POST /api/vehicles/:id/publish-route
router.post('/:id/publish-route', vehicleController.publishRoute);

// GET /api/vehicles/:id/routes
router.get('/:id/routes', vehicleController.getVehicleRoutes);

// POST /api/vehicles/shared-booking - Request shared space
router.post('/shared-booking', sharedBookingController.requestSharedSpace);

// GET /api/vehicles/carrier/:carrierId - Get all vehicles for a carrier
router.get('/carrier/:carrierId', vehicleController.getCarrierVehicles);

// GET /api/vehicles/my-fleet - Get current user's (carrier) fleet
router.get('/my-fleet', vehicleController.getCarrierVehicles);

// GET /api/vehicles/:id - Get single vehicle details
router.get('/:id', vehicleController.getVehicleById);

// PUT /api/vehicles/:id - Update vehicle details
router.put('/:id', vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Remove a vehicle
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
