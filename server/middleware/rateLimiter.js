import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants.js';

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.GENERAL_WINDOW_MS,
  max: RATE_LIMIT.GENERAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Auth-specific rate limiter — 10 requests per 15 minutes.
 * Protects login/register from brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});
