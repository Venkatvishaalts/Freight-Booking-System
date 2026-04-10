const { Review, Booking, Shipment, User } = require('../models');
const { Op } = require('sequelize');

const reviewController = {
  // Create review
  createReview: async (req, res) => {
    try {
      const { shipment_id, reviewed_user_id, rating, comment } = req.body;

      // Check if shipment exists
      const shipment = await Shipment.findByPk(shipment_id);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      // Check if shipment is delivered
      if (shipment.current_status !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Can only review delivered shipments'
        });
      }

      // Check if user exists
      const user = await User.findByPk(reviewed_user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Reviewed user not found'
        });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        where: {
          shipment_id,
          reviewer_id: req.user.id,
          reviewed_user_id
        }
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'You have already reviewed this user for this shipment'
        });
      }

      // Create review
      const review = await Review.create({
        shipment_id,
        reviewer_id: req.user.id,
        reviewed_user_id,
        rating,
        comment
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create review',
        error: error.message
      });
    }
  },

  // Get user reviews
  getUserReviews: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Check if user exists
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Review.findAndCountAll({
        where: { reviewed_user_id: userId },
        include: [
          { association: 'reviewer', attributes: ['id', 'username', 'company_name'] },
          { association: 'shipment', attributes: ['id', 'pickup_location', 'delivery_location'] }
        ],
        offset,
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      // Calculate average rating
      const averageRating = rows.length > 0
        ? (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: rows,
        averageRating: parseFloat(averageRating),
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
        message: 'Failed to fetch reviews',
        error: error.message
      });
    }
  },

  // Get shipment reviews
  getShipmentReviews: async (req, res) => {
    try {
      const { shipmentId } = req.params;

      const shipment = await Shipment.findByPk(shipmentId);

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      const reviews = await Review.findAll({
        where: { shipment_id: shipmentId },
        include: [
          { association: 'reviewer', attributes: ['id', 'username', 'company_name'] },
          { association: 'reviewed_user', attributes: ['id', 'username', 'company_name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: reviews
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews',
        error: error.message
      });
    }
  },

  // Get user average rating
  getUserAverageRating: async (req, res) => {
    try {
      const { userId } = req.params;

      const reviews = await Review.findAll({
        where: { reviewed_user_id: userId },
        attributes: ['rating']
      });

      if (reviews.length === 0) {
        return res.json({
          success: true,
          data: {
            averageRating: 0,
            totalReviews: 0
          }
        });
      }

      const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2);

      res.json({
        success: true,
        data: {
          averageRating: parseFloat(averageRating),
          totalReviews: reviews.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to calculate average rating',
        error: error.message
      });
    }
  }
};

module.exports = reviewController;