import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware, requireFirm, checkRole } from '../middleware/auth.js';
import sanitize from '../middleware/sanitize.js';
import {
  startTimer,
  stopTimer,
  getTimeEntries,
  getCaseSummary,
  deleteTimeEntry,
} from '../controllers/timeEntryController.js';
import TimeEntry from '../models/TimeEntry.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = Router();

router.use(authMiddleware, requireFirm, checkRole('admin', 'lawyer'));

router.post(
  '/start',
  sanitize,
  [
    body('caseId').notEmpty().withMessage('Case ID is required').isMongoId().withMessage('Invalid Case ID'),
    body('description').optional().trim(),
    body('billable').optional().isBoolean().withMessage('Billable must be true or false'),
  ],
  validate,
  startTimer
);

router.post('/:id/stop', stopTimer);

router.get('/', getTimeEntries);

// Returns the logged-in lawyer's own time summary across all cases
router.get('/my-summary', async (req, res, next) => {
  try {
    const [summary] = await TimeEntry.aggregate([
      {
        $match: {
          userId: req.user._id,
          firmId: req.user.firmId,
          endTime: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' },
          billableMinutes: { $sum: { $cond: ['$billable', '$duration', 0] } },
          entryCount: { $sum: 1 },
        },
      },
    ]);

    const data = summary || { totalMinutes: 0, billableMinutes: 0, entryCount: 0 };

    ApiResponse.success(res, {
      message: 'My time summary retrieved',
      data: {
        totalHours: +(data.totalMinutes / 60).toFixed(2),
        billableHours: +(data.billableMinutes / 60).toFixed(2),
        totalEntries: data.entryCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Summary route — must be before /:id
router.get('/summary/:caseId', getCaseSummary);

router.delete('/:id', deleteTimeEntry);

export default router;
