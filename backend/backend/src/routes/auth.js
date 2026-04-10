const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validators, handleValidationErrors } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/register - Register new user
router.post('/register',
  validators.register,
  handleValidationErrors,
  authController.register
);

// POST /api/auth/login - Login user
router.post('/login',
  validators.login,
  handleValidationErrors,
  authController.login
);

// GET /api/auth/verify - Verify token and get user
router.get('/verify',
  authMiddleware,
  authController.verify
);

// POST /api/auth/logout - Logout user
router.post('/logout',
  authMiddleware,
  authController.logout
);

module.exports = router;