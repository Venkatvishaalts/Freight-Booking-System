const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');
const { validators, handleValidationErrors } = require('../middleware/validation');

// POST /api/reviews - Create review
router.post('/',
  authMiddleware,
  validators.createReview,
  handleValidationErrors,
  reviewController.createReview
);

// GET /api/reviews/user/:userId - Get user reviews
router.get('/user/:userId',
  authMiddleware,
  reviewController.getUserReviews
);

// GET /api/reviews/shipment/:shipmentId - Get shipment reviews
router.get('/shipment/:shipmentId',
  authMiddleware,
  reviewController.getShipmentReviews
);

// GET /api/reviews/user/:userId/rating - Get user average rating
router.get('/user/:userId/rating',
  authMiddleware,
  reviewController.getUserAverageRating
);

module.exports = router;