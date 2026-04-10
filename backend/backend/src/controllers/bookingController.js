const { Booking, Shipment, User } = require('../models');

const bookingController = {
  // Create booking (Carrier accepts shipment)
  createBooking: async (req, res) => {
    try {
      const { shipment_id, estimated_delivery } = req.body;

      // Check if shipment exists
      const shipment = await Shipment.findByPk(shipment_id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      // Check if shipment is still available
      if (shipment.current_status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Shipment is no longer available for booking'
        });
      }

      // Check if booking already exists
      const existingBooking = await Booking.findOne({
        where: { shipment_id }
      });

      if (existingBooking) {
        return res.status(409).json({
          success: false,
          message: 'A booking already exists for this shipment'
        });
      }

      // Create booking
      const booking = await Booking.create({
        shipment_id,
        carrier_id: req.user.id,
        estimated_delivery,
        booking_status: 'pending'
      });

      // Update shipment status
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

      // Check authorization
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
          { association: 'shipment', attributes: ['id', 'pickup_location', 'delivery_location', 'current_status'] }
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

  // Accept booking
  acceptBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check authorization
      if (req.user.id !== booking.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this booking'
        });
      }

      if (booking.booking_status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot accept a booking with status: ${booking.booking_status}`
        });
      }

      booking.booking_status = 'accepted';
      booking.accepted_at = new Date();
      await booking.save();

      res.json({
        success: true,
        message: 'Booking accepted successfully',
        data: booking
      });
    } catch (error) {
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

      // Check authorization
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

      // Reset shipment status
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
    try {
      const { id } = req.params;
      const { actual_delivery } = req.body;

      const booking = await Booking.findByPk(id, {
        include: [{ association: 'shipment' }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Check authorization
      if (req.user.id !== booking.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to complete this booking'
        });
      }

      if (booking.booking_status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Only accepted bookings can be completed'
        });
      }

      booking.booking_status = 'completed';
      booking.actual_delivery = actual_delivery || new Date();
      await booking.save();

      // Update shipment status
      booking.shipment.current_status = 'delivered';
      await booking.shipment.save();

      res.json({
        success: true,
        message: 'Booking completed successfully',
        data: booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete booking',
        error: error.message
      });
    }
  }
};

module.exports = bookingController;