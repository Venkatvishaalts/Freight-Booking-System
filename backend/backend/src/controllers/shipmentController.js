const { Shipment, User, Booking, Tracking } = require('../models');
const { Op } = require('sequelize');

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
        special_instructions
      } = req.body;

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
        where,
        include: [
          { association: 'shipper', attributes: ['id', 'username', 'company_name'] },
          { association: 'carrier', attributes: ['id', 'username', 'company_name'] }
        ],
        offset,
        limit: parseInt(limit),
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

  // ================= ✅ NEW: GET SHIPPER SHIPMENTS =================
  getShipperShipments: async (req, res) => {
    try {
      const { shipperId } = req.params;

      const shipments = await Shipment.findAll({
        where: { shipper_id: shipperId },
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
  }

};

module.exports = shipmentController;