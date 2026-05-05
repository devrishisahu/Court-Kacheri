import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { register, login, getMe } from '../controllers/authController.js';
import { googleLogin } from '../controllers/googleAuth.js';

const router = Router();

// Auth routes are rate-limited separately (brute-force protection)
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firmName').optional().trim(),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// Google OAuth
router.post('/google', authLimiter, googleLogin);

router.get('/me', authMiddleware, getMe);

export default router;
