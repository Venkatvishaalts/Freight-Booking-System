const { Tracking, Shipment } = require('../models');

const trackingController = {

  // Add tracking update
  addTracking: async (req, res) => {
    try {
      const { shipment_id, location, latitude, longitude, status, notes } = req.body;

      // Check if shipment exists
      const shipment = await Shipment.findByPk(shipment_id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      // Authorization check
      if (req.user.id !== shipment.carrier_id && req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned carrier can update tracking'
        });
      }

      // Create tracking record
      const tracking = await Tracking.create({
        shipment_id,
        location,
        latitude,
        longitude,
        status,
        notes,
        timestamp: new Date()
      });

      // Update shipment status (sync with tracking)
      if (status && shipment.current_status !== status) {
        shipment.current_status = status;
        await shipment.save();
      }

      // ====================================================================
      //  SOCKET.IO EMIT (REAL-TIME UPDATE)
      // ====================================================================
      const io = req.app.get('io');

      if (io) {
        io.to(shipment_id).emit('trackingUpdated', {
          shipment_id,
          location,
          latitude,
          longitude,
          status,
          notes,
          timestamp: tracking.timestamp
        });
      }

      // ====================================================================

      res.status(201).json({
        success: true,
        message: 'Tracking update added successfully',
        data: tracking
      });

    } catch (error) {
      console.error('Tracking Error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to add tracking update',
        error: error.message
      });
    }
  },

  // Get tracking history
  getTrackingHistory: async (req, res) => {
    try {
      const { shipmentId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const shipment = await Shipment.findByPk(shipmentId);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Tracking.findAndCountAll({
        where: { shipment_id: shipmentId },
        offset,
        limit: parseInt(limit),
        order: [['timestamp', 'DESC']]
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
        message: 'Failed to fetch tracking history',
        error: error.message
      });
    }
  },

  // Get live location (latest tracking)
  getLiveLocation: async (req, res) => {
    try {
      const { shipmentId } = req.params;

      const tracking = await Tracking.findOne({
        where: { shipment_id: shipmentId },
        order: [['timestamp', 'DESC']]
      });

      if (!tracking) {
        return res.status(404).json({
          success: false,
          message: 'No tracking data found for this shipment'
        });
      }

      res.json({
        success: true,
        data: tracking
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch live location',
        error: error.message
      });
    }
  }
};

module.exports = trackingController;