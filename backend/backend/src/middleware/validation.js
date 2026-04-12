const { body, validationResult, param, query } = require('express-validator');

// Error handling for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Validation rules
const validators = {
  // Auth validators
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .isEmail()
      .withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('user_type')
      .isIn(['shipper', 'carrier', 'admin'])
      .withMessage('Invalid user type'),
    body('phone')
      .optional()
      .matches(/^[0-9]{10,15}$/)
      .withMessage('Invalid phone number'),
    body('company_name')
  .optional({ checkFalsy: true })   // ← checkFalsy: true ignores empty strings
  .trim()
  .isLength({ min: 2 })
  .withMessage('Company name must be at least 2 characters')
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Invalid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Shipment validators
  createShipment: [
    body('pickup_location')
      .trim()
      .notEmpty()
      .withMessage('Pickup location is required'),
    body('delivery_location')
      .trim()
      .notEmpty()
      .withMessage('Delivery location is required'),
    body('freight_type')
      .isIn(['electronics', 'food', 'machinery', 'furniture', 'documents', 'other'])
      .withMessage('Invalid freight type'),
    body('weight')
      .isFloat({ min: 0.1 })
      .withMessage('Weight must be a positive number'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('scheduled_pickup_date')
      .isISO8601()
      .withMessage('Invalid pickup date format'),
    body('scheduled_delivery_date')
      .isISO8601()
      .withMessage('Invalid delivery date format'),
    body('price_quote')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number')
  ],

  // Booking validators
  createBooking: [
    body('shipment_id')
      .isUUID()
      .withMessage('Invalid shipment ID'),
    body('estimated_delivery')
      .optional()
      .isISO8601()
      .withMessage('Invalid delivery date format')
  ],

  // Tracking validators
  createTracking: [
    body('shipment_id')
      .isUUID()
      .withMessage('Invalid shipment ID'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required'),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    body('status')
      .isIn(['picked_up', 'in_transit', 'out_for_delivery', 'delivered'])
      .withMessage('Invalid status')
  ],

  // Review validators
  createReview: [
    body('shipment_id')
      .isUUID()
      .withMessage('Invalid shipment ID'),
    body('reviewed_user_id')
      .isUUID()
      .withMessage('Invalid reviewed user ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comment must be less than 1000 characters')
  ]
};

module.exports = {
  handleValidationErrors,
  validators
};