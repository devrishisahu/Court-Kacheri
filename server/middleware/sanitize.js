import { PROTECTED_FIELDS } from '../config/constants.js';

/**
 * Strips server-managed fields from req.body to prevent
 * clients from setting firmId, _id, timestamps, etc.
 */
const sanitize = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const field of PROTECTED_FIELDS) {
      delete req.body[field];
    }
  }
  next();
};

export default sanitize;
