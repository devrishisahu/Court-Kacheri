import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/**
 * Middleware to restrict access to super admins only.
 * Must be used after the 'protect' middleware.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Access denied: Super Admin privilege required');
  }
  next();
};
