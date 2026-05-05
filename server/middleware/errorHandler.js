import logger from '../config/logger.js';

/**
 * Global error-handling middleware.
 * Normalizes Mongoose, JWT, Multer, and custom ApiError instances
 * into a consistent JSON response. Logs errors via winston.
 */
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ─── Mongoose: bad ObjectId ──────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ─── Mongoose: duplicate key ─────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    statusCode = 400;
    message = `Duplicate value for field(s): ${field}`;
  }

  // ─── Mongoose: validation error ──────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ─── JWT errors ──────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ─── Multer errors ───────────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the 10 MB limit';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = err.message;
    }
  }

  // ─── Log the error ───────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error(`${statusCode} — ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${statusCode} — ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
