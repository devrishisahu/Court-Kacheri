import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware, requireFirm, checkRole } from '../middleware/auth.js';
import sanitize from '../middleware/sanitize.js';
import {
  createCase,
  getCases,
  getCase,
  updateCase,
  deleteCase,
} from '../controllers/caseController.js';
import Case from '../models/Case.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ALL_CASE_STATUSES } from '../config/constants.js';

const router = Router();

router.use(authMiddleware);

// GET /api/cases/my-cases — returns only cases where req.user._id is in assignedLawyers
router.get('/my-cases', async (req, res, next) => {
  try {
    const { skip, limit, page, sort } = paginate(req.query);
    const filter = {
      firmId: req.user.firmId || null,
      assignedLawyers: req.user._id,
    };

    if (req.query.status && ALL_CASE_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .populate('clientId', 'name email')
        .populate('assignedLawyers', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Case.countDocuments(filter),
    ]);

    ApiResponse.success(res, {
      message: 'My cases retrieved',
      data: cases,
      meta: buildMeta({ total, page, limit }),
    });
  } catch (err) {
    next(err);
  }
});

router
  .route('/')
  .post(
    sanitize,
    [
      body('title').trim().notEmpty().withMessage('Case title is required'),
      body('clientId').notEmpty().withMessage('Client ID is required').isMongoId().withMessage('Invalid Client ID'),
      body('status')
        .optional()
        .isIn(['open', 'closed'])
        .withMessage('Status must be open or closed'),
      body('assignedLawyers')
        .optional()
        .isArray()
        .withMessage('Assigned lawyers must be an array'),
    ],
    validate,
    checkRole('admin', 'lawyer'),
    createCase
  )
  .get(checkRole('admin', 'lawyer', 'client'), getCases);

router
  .route('/:id')
  .get(checkRole('admin', 'lawyer', 'client'), getCase)
  .put(sanitize, checkRole('admin', 'lawyer'), updateCase)
  .delete(checkRole('admin', 'lawyer'), deleteCase);

export default router;
