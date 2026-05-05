import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware, requireFirm, checkRole } from '../middleware/auth.js';
import sanitize from '../middleware/sanitize.js';
import { ROLES, ALL_BILLING_STATUSES } from '../config/constants.js';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getRevenueSummary,
} from '../controllers/billingController.js';

const router = Router();

router.use(authMiddleware, requireFirm);

// Summary route — must be before /:id (admin only)
router.get('/summary', checkRole(ROLES.ADMIN), getRevenueSummary);

router
  .route('/')
  .post(
    checkRole(ROLES.ADMIN),
    sanitize,
    [
      body('caseId').notEmpty().withMessage('Case ID is required').isMongoId().withMessage('Invalid Case ID'),
      body('clientId').notEmpty().withMessage('Client ID is required').isMongoId().withMessage('Invalid Client ID'),
      body('items').optional().isArray().withMessage('Items must be an array'),
      body('rate').optional().isNumeric().withMessage('Rate must be a number'),
      body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    ],
    validate,
    createInvoice
  )
  .get(checkRole(ROLES.ADMIN, ROLES.CLIENT), getInvoices);

router
  .route('/:id')
  .get(checkRole(ROLES.ADMIN, ROLES.CLIENT), getInvoice)
  .put(checkRole(ROLES.ADMIN), sanitize, updateInvoice)
  .delete(checkRole(ROLES.ADMIN), deleteInvoice);

router.put(
  '/:id/status',
  checkRole(ROLES.ADMIN),
  [body('status').isIn(ALL_BILLING_STATUSES).withMessage(`Status must be one of: ${ALL_BILLING_STATUSES.join(', ')}`)],
  validate,
  updateInvoiceStatus
);

export default router;
