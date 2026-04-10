const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, authorize } = require('../middleware/auth');

// GET /api/users/:id - Get user profile
router.get('/:id',
  authMiddleware,
  userController.getProfile
);

// PUT /api/users/:id - Update user profile
router.put('/:id',
  authMiddleware,
  userController.updateProfile
);

// GET /api/users - Get all users (admin only)
router.get('/',
  authMiddleware,
  authorize('admin'),
  userController.getAllUsers
);

// GET /api/users/:id/vehicles - Get user vehicles
router.get('/:id/vehicles',
  authMiddleware,
  userController.getUserVehicles
);

// POST /api/users/:id/vehicles - Add vehicle
router.post('/:id/vehicles',
  authMiddleware,
  userController.addVehicle
);

// PUT /api/users/vehicles/:vehicleId - Update vehicle
router.put('/vehicles/:vehicleId',
  authMiddleware,
  userController.updateVehicle
);

// DELETE /api/users/vehicles/:vehicleId - Delete vehicle
router.delete('/vehicles/:vehicleId',
  authMiddleware,
  userController.deleteVehicle
);

module.exports = router;