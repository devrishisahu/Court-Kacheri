import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware that checks express-validator results.
 * If errors exist, throws an ApiError with the first message.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    throw new ApiError(400, message);
  }
  next();
};

export default validate;
