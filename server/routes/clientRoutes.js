import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware, requireFirm, checkRole } from '../middleware/auth.js';
import sanitize from '../middleware/sanitize.js';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';

const router = Router();

// All client routes require auth + firm membership
router.use(authMiddleware, requireFirm, checkRole('admin', 'lawyer'));

router
  .route('/')
  .post(
    sanitize,
    [
      body('name').trim().notEmpty().withMessage('Client name is required'),
      body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
      body('phone').optional().trim(),
    ],
    validate,
    createClient
  )
  .get(getClients);

router
  .route('/:id')
  .get(getClient)
  .put(sanitize, updateClient)
  .delete(deleteClient);

export default router;
