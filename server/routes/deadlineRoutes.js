import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware, requireFirm } from '../middleware/auth.js';
import sanitize from '../middleware/sanitize.js';
import { ALL_DEADLINE_TYPES, ALL_DEADLINE_STATUSES } from '../config/constants.js';
import {
  createDeadline,
  getDeadlines,
  getDeadline,
  updateDeadline,
  deleteDeadline,
  getConflicts,
} from '../controllers/deadlineController.js';

const router = Router();

router.use(authMiddleware, requireFirm);

router
  .route('/')
  .post(
    sanitize,
    [
      body('caseId').notEmpty().withMessage('Case ID is required').isMongoId().withMessage('Invalid Case ID'),
      body('title').trim().notEmpty().withMessage('Deadline title is required'),
      body('dueDate').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid date format'),
      body('type').isIn(ALL_DEADLINE_TYPES).withMessage(`Type must be one of: ${ALL_DEADLINE_TYPES.join(', ')}`),
      body('status').optional().isIn(ALL_DEADLINE_STATUSES).withMessage(`Status must be one of: ${ALL_DEADLINE_STATUSES.join(', ')}`),
    ],
    validate,
    createDeadline
  )
  .get(getDeadlines);

// Conflicts route — must be before /:id to avoid param clash
router.get('/conflicts/:caseId', getConflicts);

router
  .route('/:id')
  .get(getDeadline)
  .put(sanitize, updateDeadline)
  .delete(deleteDeadline);

export default router;
