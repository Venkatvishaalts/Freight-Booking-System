const { Booking, Shipment, User, Tracking, Vehicle } = require('../models');
const sequelize = require('../config/database');

const bookingController = {
  // Create booking (Carrier accepts shipment)
  createBooking: async (req, res) => {
    try {
      const { shipment_id, estimated_delivery } = req.body;

      const shipment = await Shipment.findByPk(shipment_id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      if (shipment.current_status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Shipment is no longer available for booking'
        });
      }

      const existingBooking = await Booking.findOne({
        where: { shipment_id }
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'A booking already exists for this shipment'
        });
      }

      const booking = await Booking.create({
        shipment_id,
        carrier_id: req.user.id,
        estimated_delivery,
        booking_status: 'accepted',
        accepted_at: new Date()
      });

      shipment.current_status = 'confirmed';
      shipment.carrier_id = req.user.id;
      await shipment.save();

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message
      });
    }
  },

  // Get all bookings
  getAllBookings: async (req, res) => {
    try {
      const { status, carrier_id, shipper_id, page = 1, limit = 10 } = req.query;

      const where = {};
      if (status) where.booking_status = status;
      if (carrier_id) where.carrier_id = carrier_id;

      const offset = (page - 1) * limit;

      const { count, rows } = await Booking.findAndCountAll({
        where,
        include: [
          { association: 'shipment', include: [{ association: 'shipper' }] },
          { association: 'carrier', attributes: ['id', 'username', 'company_name'] }
        ],
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
        message: 'Failed to fetch bookings',
        error: error.message
      });
    }
  },

  // Get single booking
  getBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id, {
        include: [
          { association: 'shipment', include: [{ association: 'shipper' }] },
          { association: 'carrier', attributes: { exclude: ['password_hash'] } }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking',
        error: error.message
      });
    }
  },

  // Get carrier's bookings
  getCarrierBookings: async (req, res) => {
    try {
      const { carrierId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (req.user.id !== carrierId && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these bookings'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Booking.findAndCountAll({
        where: { carrier_id: carrierId },
        include: [
          { 
            association: 'shipment', 
            include: [{ association: 'assigned_vehicle' }] // To get assigned_vehicle
          }
        ],
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
        message: 'Failed to fetch bookings',
        error: error.message
      });
    }
  },

  //  Accept booking (UPDATED)
  acceptBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { price_quote } = req.body;
      console.log(`[AcceptBooking] ID: ${id}, Price: ${price_quote}`);

      const booking = await Booking.findByPk(id);

      if (!booking) {
        console.error('[AcceptBooking] Booking not found');
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      //  Fetch shipment (needed for tracking and price update)
      const shipment = await Shipment.findByPk(booking.shipment_id);
      if (!shipment) {
        console.error('[AcceptBooking] Shipment not found for booking');
        return res.status(404).json({
          success: false,
          message: 'Associated shipment not found'
        });
      }

      booking.booking_status = 'accepted';
      booking.accepted_at = new Date();
      await booking.save();

      //  Update shipment status and price
      if (shipment.vehicle_id) {
        shipment.current_status = 'in_transit';
      } else {
        shipment.current_status = 'confirmed';
      }
      
      if (price_quote !== undefined && price_quote !== null) {
        shipment.price_quote = parseFloat(price_quote) || 0;
      }

      shipment.carrier_id = req.user.id;
      await shipment.save();

      //  Auto-create first tracking event
      try {
        await Tracking.create({
          shipment_id: booking.shipment_id,
          status: 'picked_up',
          location: shipment.pickup_location || 'Carrier Facility',
          latitude: 0,
          longitude: 0,
          notes: 'Carrier accepted the booking. Pickup in progress.',
          timestamp: new Date(),
        });
      } catch (trackErr) {
        console.error('[AcceptBooking] Tracking creation failed (non-fatal):', trackErr.message);
      }

      console.log('[AcceptBooking] Success');
      res.json({
        success: true,
        message: 'Booking accepted successfully',
        data: booking
      });
    } catch (error) {
      console.error('[AcceptBooking] CRITICAL ERROR:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept booking',
        error: error.message
      });
    }
  },

  // Decline booking
  declineBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id, {
        include: [{ association: 'shipment' }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (req.user.id !== booking.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to decline this booking'
        });
      }

      if (booking.booking_status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot decline a booking that is not pending'
        });
      }

      booking.booking_status = 'declined';
      await booking.save();

      booking.shipment.current_status = 'pending';
      booking.shipment.carrier_id = null;
      await booking.shipment.save();

      res.json({
        success: true,
        message: 'Booking declined successfully',
        data: booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to decline booking',
        error: error.message
      });
    }
  },

  // Complete booking
  completeBooking: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { actual_delivery } = req.body || {};

      const booking = await Booking.findByPk(id, {
        include: [{ association: 'shipment' }],
        transaction: t
      });

      if (!booking) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Edge Case: Booking already completed
      if (booking.booking_status === 'completed') {
        await t.rollback();
        return res.json({
          success: true,
          message: 'Booking already completed',
          vehicleStatus: 'AVAILABLE',
          data: booking
        });
      }

      if (req.user.id !== booking.carrier_id && req.user.user_type !== 'admin') {
        await t.rollback();
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to complete this booking'
        });
      }

      if (booking.booking_status !== 'accepted' && booking.booking_status !== 'in_transit' && booking.booking_status !== 'pending') {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot complete a booking with status: ${booking.booking_status}`
        });
      }

      booking.booking_status = 'completed';
      booking.actual_delivery = actual_delivery || new Date();
      await booking.save({ transaction: t });

      if (booking.shipment) {
        const now = new Date();
        
        // Update shipment
        booking.shipment.current_status = 'delivered';
        booking.shipment.delivered_at = now;
        await booking.shipment.save({ transaction: t });

        // Handle vehicle capacity and status
        if (booking.shipment.vehicle_id) {
          const vehicle = await Vehicle.findByPk(booking.shipment.vehicle_id, { transaction: t });
          
          if (!vehicle) {
            await t.rollback();
            return res.status(404).json({
              success: false,
              message: 'Assigned vehicle not found'
            });
          }

          // Subtract the shipment weight from the vehicle's used capacity
          const shipmentWeight = parseFloat(booking.shipment.weight) || 0;
          let newUsedCapacity = (parseFloat(vehicle.used_weight_capacity) || 0) - shipmentWeight;
          
          // Prevent negative capacity
          if (newUsedCapacity < 0) newUsedCapacity = 0;
          
          vehicle.used_weight_capacity = newUsedCapacity;
          
          // Check for other active shipments on this vehicle
          const activeCount = await Shipment.count({
            where: {
              vehicle_id: booking.shipment.vehicle_id,
              current_status: ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery']
            },
            transaction: t
          });

          if (activeCount === 0) {
            vehicle.status = 'available';
            vehicle.capacity_status = 'available';
            vehicle.used_weight_capacity = 0;
            vehicle.current_shipment_id = null;
          } else {
            vehicle.capacity_status = 'partial';
            // Handle floating point precision
            if (vehicle.used_weight_capacity < 0.1) vehicle.used_weight_capacity = 0;
          }
          
          vehicle.last_delivery_completed_at = now;
          
          await vehicle.save({ transaction: t });
        }
      }

      await t.commit();

      res.json({
        success: true,
        message: 'Delivery completed successfully',
        vehicleStatus: 'AVAILABLE',
        data: booking
      });
    } catch (error) {
      if (t && !t.finished) {
        await t.rollback();
      }
      console.error('Error completing booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete booking',
        error: error.message
      });
    }
  },

  // Assign vehicle to a booking/shipment
  assignVehicle: async (req, res) => {
    try {
      const { id } = req.params; // Booking ID
      const { vehicle_id } = req.body;

      const booking = await Booking.findByPk(id, {
        include: [{ association: 'shipment' }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check ownership
      if (booking.carrier_id !== req.user.id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No permission to assign vehicle to this booking'
        });
      }

      // Check vehicle
      const vehicle = await Vehicle.findByPk(vehicle_id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (vehicle.carrier_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'This vehicle does not belong to your fleet'
        });
      }

      // Check capacity if vehicle is already in use
      if (vehicle.status === 'out_for_delivery' && vehicle.capacity_status === 'full') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle is currently full and cannot accept more shipments'
        });
      }

      const shipmentWeight = (booking.shipment && booking.shipment.weight) ? parseFloat(booking.shipment.weight) : 0;
      const currentUsed = parseFloat(vehicle.used_weight_capacity) || 0;
      const newUsedCapacity = currentUsed + shipmentWeight;

      if (vehicle.total_weight_capacity && newUsedCapacity > vehicle.total_weight_capacity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient capacity. Vehicle limit: ${vehicle.total_weight_capacity}kg, currently using: ${currentUsed}kg, required: ${shipmentWeight}kg`
        });
      }

      // Update shipment
      booking.shipment.vehicle_id = vehicle_id;
      booking.shipment.current_status = 'in_transit';
      await booking.shipment.save();

      // Update booking status
      if (booking.booking_status === 'pending') {
        booking.booking_status = 'accepted';
        booking.accepted_at = new Date();
        await booking.save();
      }

      // Update vehicle status and capacity
      vehicle.status = 'out_for_delivery';
      vehicle.current_shipment_id = booking.shipment_id;
      vehicle.used_weight_capacity = newUsedCapacity;
      
      // Auto-update capacity status
      if (vehicle.total_weight_capacity && vehicle.used_weight_capacity >= vehicle.total_weight_capacity) {
        vehicle.capacity_status = 'full';
      } else {
        vehicle.capacity_status = 'partial';
      }

      await vehicle.save();

      // Create tracking entry
      await Tracking.create({
        shipment_id: booking.shipment_id,
        status: 'in_transit',
        location: booking.shipment.pickup_location,
        notes: `Vehicle assigned: ${vehicle.vehicle_number} (${vehicle.vehicle_type}). Out for delivery.`,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Vehicle assigned and shipment is now in transit',
        data: {
          booking,
          vehicle
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to assign vehicle',
        error: error.message
      });
    }
  }
};

module.exports = bookingController;