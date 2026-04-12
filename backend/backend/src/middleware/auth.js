const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔍 authorize() called');
    console.log('req.user:', req.user);
    console.log('required roles:', roles);
    console.log('user_type value:', req.user?.user_type);
    console.log('match?', roles.includes(req.user?.user_type));

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userRole = String(req.user.user_type || '').trim().toLowerCase();
    const allowedRoles = roles.map(role => String(role).trim().toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(', ')} can access this resource`
      });
    }

    next();
  };
};

// ✅ THIS WAS MISSING
module.exports = { authMiddleware, authorize };