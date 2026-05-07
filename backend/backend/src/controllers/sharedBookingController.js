const { Vehicle, Route, Shipment, Booking, User } = require('../models');
const aiService = require('../services/aiService');
const { Op } = require('sequelize');

const sharedBookingController = {
  /**
   * Search for vehicles moving in the same direction with enough capacity
   */
  searchAvailableSpace: async (req, res) => {
    try {
      const { pickup, destination, weight } = req.query;

      if (!pickup || !destination || !weight) {
        return res.status(400).json({ success: false, message: 'Pickup, destination and weight are required' });
      }

      const reqWeight = parseFloat(weight);

      // Find all active routes
      const activeRoutes = await Route.findAll({
        where: { is_active: true },
        include: [{
          model: Vehicle,
          as: 'assigned_vehicle',
          where: {
            capacity_status: { [Op.ne]: 'full' },
            status: 'out_for_delivery'
          }
        }]
      });

      // Filter routes using AI Service route matching logic
      const matchingVehicles = activeRoutes.filter(route => {
        const isRouteMatch = aiService.matchRoute(route, pickup, destination);
        const totalCap = route.assigned_vehicle.total_weight_capacity || Infinity; // Treat null as infinite
        const usedCap = route.assigned_vehicle.used_weight_capacity || 0;
        const hasCapacity = (totalCap - usedCap) >= reqWeight;
        return isRouteMatch && hasCapacity;
      });

      res.json({
        success: true,
        count: matchingVehicles.length,
        data: matchingVehicles.map(r => ({
          route_id: r.id,
          vehicle: r.assigned_vehicle,
          source: r.source,
          destination: r.destination,
          intermediate_points: r.intermediate_points,
          estimated_arrival: r.estimated_arrival,
          price_per_kg: r.price_per_kg,
          remaining_capacity: (r.assigned_vehicle.total_weight_capacity || 999999) - (r.assigned_vehicle.used_weight_capacity || 0)
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Search failed', error: error.message });
    }
  },

  /**
   * Create a shared booking request for a specific vehicle route
   */
  requestSharedSpace: async (req, res) => {
    try {
      const { route_id, pickup_location, delivery_location, weight, volume_cm3, freight_type, price_quote } = req.body;

      const route = await Route.findByPk(route_id, {
        include: [{ model: Vehicle, as: 'assigned_vehicle' }]
      });

      if (!route || !route.is_active) {
        return res.status(404).json({ success: false, message: 'Route not found or inactive' });
      }

      const vehicle = route.assigned_vehicle;
      const reqWeight = parseFloat(weight);

      // Double check capacity
      if ((vehicle.total_weight_capacity - vehicle.used_weight_capacity) < reqWeight) {
        return res.status(400).json({ success: false, message: 'Insufficient capacity on this vehicle' });
      }

      // 1. Create the Shipment
      const shipment = await Shipment.create({
        shipper_id: req.user.id,
        carrier_id: vehicle.carrier_id,
        pickup_location,
        delivery_location,
        weight: reqWeight,
        volume_cm3,
        freight_type: ['electronics', 'food', 'machinery', 'furniture', 'documents', 'other'].includes(freight_type) ? freight_type : 'other',
        price_quote,
        is_shared: true,
        vehicle_id: vehicle.id,
        current_status: 'pending', // Carrier must approve
        scheduled_pickup_date: route.departure_time || new Date(),
        scheduled_delivery_date: route.estimated_arrival || new Date(Date.now() + 86400000) // Default +1 day
      });

      // 2. Create the Booking
      const booking = await Booking.create({
        shipment_id: shipment.id,
        carrier_id: vehicle.carrier_id,
        booking_status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Shared booking request sent to carrier',
        data: { shipment, booking }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Booking failed', error: error.message });
    }
  }
};

module.exports = sharedBookingController;
