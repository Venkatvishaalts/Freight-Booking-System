const { User, Vehicle } = require('../models');

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: error.message
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, phone, company_name, profile_image } = req.body;

      // Check authorization - user can only update their own profile
      if (req.user.id !== userId && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this profile'
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update fields
      if (username) user.username = username;
      if (phone) user.phone = phone;
      if (company_name) user.company_name = company_name;
      if (profile_image) user.profile_image = profile_image;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  },

  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      const { user_type, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (user_type) where.user_type = user_type;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password_hash'] },
        offset,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  },

  // Get user vehicles (for carriers)
  getUserVehicles: async (req, res) => {
    try {
      const userId = req.params.id;

      const user = await User.findByPk(userId, {
        include: [{ association: 'vehicles' }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user.vehicles || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicles',
        error: error.message
      });
    }
  },

  // Add vehicle (for carriers)
  addVehicle: async (req, res) => {
    try {
      const userId = req.params.id;
      const { vehicle_type, capacity_kg, license_plate, registration_number, manufactured_year } = req.body;

      // Check authorization
      if (req.user.id !== userId && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to add vehicles'
        });
      }

      const user = await User.findByPk(userId);

      if (!user || user.user_type !== 'carrier') {
        return res.status(400).json({
          success: false,
          message: 'Only carriers can add vehicles'
        });
      }

      const vehicle = await Vehicle.create({
        carrier_id: userId,
        vehicle_type,
        capacity_kg,
        license_plate,
        registration_number,
        manufactured_year
      });

      res.status(201).json({
        success: true,
        message: 'Vehicle added successfully',
        data: vehicle
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'License plate already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add vehicle',
        error: error.message
      });
    }
  },

  // Update vehicle
  updateVehicle: async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { status, capacity_kg, registration_number } = req.body;

      const vehicle = await Vehicle.findByPk(vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check authorization
      if (req.user.id !== vehicle.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this vehicle'
        });
      }

      if (status) vehicle.status = status;
      if (capacity_kg) vehicle.capacity_kg = capacity_kg;
      if (registration_number) vehicle.registration_number = registration_number;

      await vehicle.save();

      res.json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
        error: error.message
      });
    }
  },

  // Delete vehicle
  deleteVehicle: async (req, res) => {
    try {
      const { vehicleId } = req.params;

      const vehicle = await Vehicle.findByPk(vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check authorization
      if (req.user.id !== vehicle.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this vehicle'
        });
      }

      await vehicle.destroy();

      res.json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle',
        error: error.message
      });
    }
  }
};

module.exports = userController;