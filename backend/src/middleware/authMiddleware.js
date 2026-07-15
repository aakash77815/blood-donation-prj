const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const User = require('../models/User');

// Verifies the JWT sent in the Authorization header and attaches the user to req.user
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Not authorized — no token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (in case role/status changed since token was issued)
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(401, 'Not authorized — user no longer exists');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'This account has been deactivated');
    }

    req.user = user; // attach user document to request for use in controllers
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Not authorized — invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Not authorized — token expired, please log in again'));
    }
    next(error);
  }
};

// Restricts access to specific roles — use after `protect`
// Usage: router.get('/admin-only', protect, authorize('admin'), handler)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not permitted to access this resource`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
