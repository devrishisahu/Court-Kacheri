import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Protects routes by verifying the JWT in the Authorization header.
 * Attaches the authenticated user to req.user.
 */
export const authMiddleware = asyncHandler(async (req, _res, next) => {
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      throw new ApiError(401, 'Not authorized — user no longer exists');
    }

    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Not authorized — token invalid');
  }
});

/**
 * Restricts access to specific roles.
 * Usage: checkRole('admin', 'lawyer')
 */
export const checkRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access Denied: Role '${req.user.role}' is not authorized to perform this action`
      );
    }
    next();
  };
};

// Keep authorize as an alias for backward compatibility if needed
export const authorize = checkRole;

/**
 * Ensures the authenticated user belongs to a firm.
 * Shared middleware — replaces inline requireFirm() calls in controllers.
 */
export const requireFirm = (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  // Clients and Super Admins don't have a single firm assignment
  if (req.user.role === 'client' || req.user.role === 'super_admin') {
    return next();
  }

  if (!req.user.firmId) {
    // If user is admin but has no firmId, they might be in setup phase. 
    // We allow them through, but controllers should handle null firmId (usually results in empty data).
    if (req.user.role === 'admin') {
      return next();
    }
    throw new ApiError(403, 'You must belong to a firm to access this resource');
  }
  next();
};
