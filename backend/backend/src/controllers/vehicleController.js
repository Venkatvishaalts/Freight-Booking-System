const { Vehicle, User, Route } = require('../models');

const vehicleController = {
  // Add a new vehicle
  addVehicle: async (req, res) => {
    try {
      const {
        vehicle_number,
        vehicle_type,
        capacity_kg,
        total_weight_capacity,
        driver_name,
        driver_phone,
        registration_number,
        manufactured_year
      } = req.body;

      // Check if user is a carrier
      if (req.user.user_type !== 'carrier' && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only carriers can add vehicles'
        });
      }

      const vehicle = await Vehicle.create({
        carrier_id: req.user.id,
        vehicle_number,
        vehicle_type,
        capacity_kg: capacity_kg || total_weight_capacity,
        total_weight_capacity: total_weight_capacity || capacity_kg,
        driver_name,
        driver_phone,
        registration_number,
        manufactured_year,
        status: 'available'
      });

      res.status(201).json({
        success: true,
        message: 'Vehicle added successfully',
        data: vehicle
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add vehicle',
        error: error.message
      });
    }
  },

  // Publish a route for a vehicle
  publishRoute: async (req, res) => {
    try {
      const { id } = req.params; // Vehicle ID
      const { source, destination, intermediate_points, departure_time, estimated_arrival } = req.body;

      const vehicle = await Vehicle.findByPk(id);
      if (!vehicle || vehicle.carrier_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized or vehicle not found' });
      }

      // Mark old routes as inactive
      await Route.update({ is_active: false }, { where: { vehicle_id: id, is_active: true } });

      const route = await Route.create({
        vehicle_id: id,
        source,
        destination,
        intermediate_points,
        departure_time,
        estimated_arrival
      });

      res.status(201).json({
        success: true,
        message: 'Route published successfully',
        data: route
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to publish route', error: error.message });
    }
  },

  // Get active routes for a vehicle
  getVehicleRoutes: async (req, res) => {
    try {
      const { id } = req.params;
      const routes = await Route.findAll({
        where: { vehicle_id: id, is_active: true }
      });
      res.json({ success: true, data: routes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch routes', error: error.message });
    }
  },

  // Update vehicle details
  updateVehicle: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vehicle = await Vehicle.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check ownership
      if (vehicle.carrier_id !== req.user.id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No permission to update this vehicle'
        });
      }

      await vehicle.update(updateData);

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

  // Delete a vehicle
  deleteVehicle: async (req, res) => {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check ownership
      if (vehicle.carrier_id !== req.user.id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No permission to delete this vehicle'
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
  },

  // Get all vehicles for a carrier
  getCarrierVehicles: async (req, res) => {
    try {
      const carrier_id = req.params.carrierId || req.user.id;

      const vehicles = await Vehicle.findAll({
        where: { carrier_id }
      });

      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicles',
        error: error.message
      });
    }
  },

  // Get single vehicle details
  getVehicleById: async (req, res) => {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findByPk(id, {
        include: [{ model: User, as: 'carrier', attributes: ['username', 'company_name'] }]
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      res.json({
        success: true,
        data: vehicle
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle details',
        error: error.message
      });
    }
  },

  // Get available vehicles
  getAvailableVehicles: async (req, res) => {
    try {
      const vehicles = await Vehicle.findAll({
        where: {
          status: 'available',
          carrier_id: req.user.id // Only own vehicles for carriers
        },
        order: [['vehicle_number', 'ASC']]
      });

      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available vehicles',
        error: error.message
      });
    }
  }
};

module.exports = vehicleController;
