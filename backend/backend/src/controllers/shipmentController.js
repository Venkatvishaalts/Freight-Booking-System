const { Shipment, User, Booking, Tracking } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

const shipmentController = {

  // ================= CREATE SHIPMENT =================
  createShipment: async (req, res) => {
    try {
      const {
        pickup_location,
        delivery_location,
        freight_type,
        weight,
        dimensions,
        quantity,
        scheduled_pickup_date,
        scheduled_delivery_date,
        price_quote,
        description,
        special_instructions,
        is_circular,
        packaging_type,
        volume_cm3
      } = req.body;

      // Mock distance for carbon footprint calculation (in a real app, this would use a Maps API)
      const mockDistance = 150; // 150 km
      const carbonEstimate = aiService.estimateCarbonFootprint(weight, mockDistance, 'truck');

      const shipment = await Shipment.create({
        shipper_id: req.user.id,
        pickup_location,
        delivery_location,
        freight_type,
        weight,
        dimensions,
        quantity,
        scheduled_pickup_date,
        scheduled_delivery_date,
        price_quote,
        description,
        special_instructions,
        is_circular: is_circular || false,
        packaging_type: packaging_type || 'standard',
        volume_cm3,
        carbon_footprint_estimate: carbonEstimate,
        current_status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: shipment
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create shipment',
        error: error.message
      });
    }
  },

  // ================= GET ALL SHIPMENTS =================
  getAllShipments: async (req, res) => {
    try {
      const {
        status,
        freight_type,
        min_weight,
        max_weight,
        shipper_id,
        carrier_id,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const where = {};

      if (status) where.current_status = status;
      if (freight_type) where.freight_type = freight_type;
      if (shipper_id) where.shipper_id = shipper_id;
      if (carrier_id) where.carrier_id = carrier_id;

      if (min_weight || max_weight) {
        where.weight = {};
        if (min_weight) where.weight[Op.gte] = parseFloat(min_weight);
        if (max_weight) where.weight[Op.lte] = parseFloat(max_weight);
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Shipment.findAndCountAll({
        where: {
          ...where,
          '$bookings.id$': null
        },
        include: [
          { association: 'bookings', required: false, attributes: [] },
          { association: 'shipper', attributes: ['id', 'username', 'company_name'] },
          { association: 'carrier', attributes: ['id', 'username', 'company_name'] }
        ],
        offset,
        limit: parseInt(limit),
        subQuery: false,
        order: [[sort_by, sort_order]]
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
        message: 'Failed to fetch shipments',
        error: error.message
      });
    }
  },

  // =================  NEW: GET SHIPPER SHIPMENTS =================
  getShipperShipments: async (req, res) => {
    try {
      const { shipperId } = req.params;
      const actualShipperId = shipperId === 'me' ? req.user.id : shipperId;
      const shipments = await Shipment.findAll({
        where: { shipper_id: actualShipperId },
        include: [
          { association: 'carrier', attributes: ['id', 'username', 'company_name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: shipments
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shipper shipments',
        error: error.message
      });
    }
  },

  // =================  NEW: GET CARRIER SHIPMENTS =================
  getCarrierShipments: async (req, res) => {
    try {
      const { carrierId } = req.params;
      const actualCarrierId = carrierId === 'me' ? req.user.id : carrierId;

      const shipments = await Shipment.findAll({
        where: { carrier_id: actualCarrierId },
        include: [
          { association: 'shipper', attributes: ['id', 'username', 'company_name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: shipments
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch carrier shipments',
        error: error.message
      });
    }
  },

  // ================= GET SINGLE SHIPMENT =================
  getShipment: async (req, res) => {
    try {
      const { id } = req.params;

      const shipment = await Shipment.findByPk(id, {
        include: [
          { association: 'shipper', attributes: { exclude: ['password_hash'] } },
          { association: 'carrier', attributes: { exclude: ['password_hash'] } },
          { association: 'bookings' },
          { association: 'tracking_history' },
          { association: 'reviews' }
        ]
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      res.json({
        success: true,
        data: shipment
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shipment',
        error: error.message
      });
    }
  },

  // ================= UPDATE SHIPMENT =================
  updateShipment: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const shipment = await Shipment.findByPk(id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      const isShipper = req.user.id === shipment.shipper_id;
      const isCarrier = req.user.id === shipment.carrier_id;
      const isAdmin = req.user.user_type === 'admin';

      if (!isShipper && !isCarrier && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No permission'
        });
      }

      // ===== CARRIER UPDATE =====
      if (isCarrier && !isShipper && !isAdmin) {
        const { current_status } = updateData;

        if (!current_status) {
          return res.status(400).json({
            success: false,
            message: 'Status required'
          });
        }

        shipment.current_status = current_status;
        await shipment.save();

        return res.json({
          success: true,
          message: 'Shipment status updated',
          data: shipment
        });
      }

      // ===== SHIPPER UPDATE =====
      const allowedFields = [
        'pickup_location',
        'delivery_location',
        'weight',
        'quantity',
        'price_quote',
        'description',
        'special_instructions',
        'scheduled_pickup_date',
        'scheduled_delivery_date'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          shipment[field] = updateData[field];
        }
      });

      await shipment.save();

      res.json({
        success: true,
        message: 'Shipment updated successfully',
        data: shipment
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update shipment',
        error: error.message
      });
    }
  },

  // ================= CANCEL SHIPMENT =================
  cancelShipment: async (req, res) => {
    try {
      const { id } = req.params;

      const shipment = await Shipment.findByPk(id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      if (req.user.id !== shipment.shipper_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No permission'
        });
      }

      shipment.current_status = 'cancelled';
      await shipment.save();

      res.json({
        success: true,
        message: 'Shipment cancelled successfully',
        data: shipment
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel shipment',
        error: error.message
      });
    }
  },

  // ================= COMPLETE SHIPMENT =================
  completeShipment: async (req, res) => {
    try {
      const { id } = req.params;
      const { Vehicle } = require('../models');

      const shipment = await Shipment.findByPk(id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      // Authorization check (carrier assigned to shipment or admin)
      if (req.user.id !== shipment.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No permission to complete this shipment'
        });
      }

      const now = new Date();

      // Update shipment
      shipment.current_status = 'delivered';
      shipment.delivered_at = now;
      await shipment.save();

      // Update associated booking if exists
      const booking = await Booking.findOne({ where: { shipment_id: id } });
      if (booking) {
        booking.booking_status = 'completed';
        booking.actual_delivery = now;
        await booking.save();
      }

      // Handle vehicle release
      if (shipment.vehicle_id) {
        const vehicle = await Vehicle.findByPk(shipment.vehicle_id);
        if (vehicle) {
          // Release capacity
          const weight = parseFloat(shipment.weight || 0);
          vehicle.used_weight_capacity = Math.max(0, (parseFloat(vehicle.used_weight_capacity) || 0) - weight);
          
          // Check for other active shipments on this vehicle
          const activeCount = await Shipment.count({
            where: {
              vehicle_id: shipment.vehicle_id,
              current_status: ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery']
            }
          });

          if (activeCount === 0) {
            vehicle.status = 'available';
            vehicle.capacity_status = 'available';
            vehicle.used_weight_capacity = 0;
            vehicle.current_shipment_id = null;
            vehicle.last_delivery_completed_at = now;
          } else {
            vehicle.capacity_status = 'partial';
            // Ensure used_weight_capacity doesn't drift due to floating point
            if (vehicle.used_weight_capacity < 0.1) vehicle.used_weight_capacity = 0;
          }
          
          await vehicle.save();
        }
      }

      // Create tracking entry
      await Tracking.create({
        shipment_id: id,
        status: 'delivered',
        location: shipment.delivery_location,
        notes: 'Shipment successfully delivered. Vehicle released.',
        timestamp: now
      });

      res.json({
        success: true,
        message: 'Shipment completed successfully',
        vehicleStatus: 'available',
        data: shipment
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete shipment',
        error: error.message
      });
    }
  }

};

module.exports = shipmentController;