import mongoose from 'mongoose';
import Deadline from '../models/Deadline.js';
import Case from '../models/Case.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { DEADLINE_STATUS, ROLES } from '../config/constants.js';

/**
 * @desc    Create a new deadline (with conflict detection)
 * @route   POST /api/deadlines
 * @access  Private (firm members)
 */
export const createDeadline = asyncHandler(async (req, res) => {
  const { caseId, dueDate } = req.body;

  // Verify case belongs to user's firm AND lawyer is assigned to it
  const filter = { _id: caseId, firmId: req.user.firmId };
  if (req.user.role === ROLES.LAWYER) {
    filter.assignedLawyers = req.user._id;
  }

  const caseDoc = await Case.findOne(filter);
  if (!caseDoc) {
    throw new ApiError(404, 'Case not found or access denied');
  }

  // Validate dueDate is in the future
  const due = new Date(dueDate);
  if (due <= new Date()) {
    throw new ApiError(400, 'Due date must be in the future');
  }

  // Check for conflicts — same case, within ±1 hour
  const oneHour = 60 * 60 * 1000;
  const conflicts = await Deadline.find({
    caseId,
    firmId: req.user.firmId,
    status: { $ne: DEADLINE_STATUS.COMPLETED },
    dueDate: {
      $gte: new Date(due.getTime() - oneHour),
      $lte: new Date(due.getTime() + oneHour),
    },
  });

  const deadline = await Deadline.create({
    ...req.body,
    firmId: req.user.firmId,
  });

  ApiResponse.created(res, {
    message: conflicts.length > 0
      ? `Deadline created with ${conflicts.length} potential conflict(s) detected`
      : 'Deadline created successfully',
    data: {
      deadline,
      ...(conflicts.length > 0 && { conflicts }),
    },
  });
});

/**
 * @desc    Get all deadlines (paginated, filterable)
 * @route   GET /api/deadlines?status=upcoming&caseId=xxx&from=2024-01-01&to=2024-12-31&sort=dueDate
 * @access  Private (firm members)
 */
export const getDeadlines = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = paginate(req.query);
  const filter = { firmId: req.user.firmId };

  // LAWYER RESTRICTION: Only see deadlines for cases you are assigned to
  if (req.user.role === ROLES.LAWYER) {
    const lawyerCases = await Case.find({
      firmId: req.user.firmId,
      assignedLawyers: req.user._id,
    }).select('_id');
    const caseIds = lawyerCases.map((c) => c._id);
    filter.caseId = { $in: caseIds };
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.caseId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.caseId)) {
      throw new ApiError(400, 'Invalid caseId format');
    }
    // If lawyer provided a specific caseId, it must be in their assigned list
    if (filter.caseId && !filter.caseId.$in.some(id => id.toString() === req.query.caseId)) {
       throw new ApiError(403, 'Access denied to this case');
    }
    filter.caseId = req.query.caseId;
  }
  if (req.query.type) filter.type = req.query.type;

  // Date range filter
  if (req.query.from || req.query.to) {
    filter.dueDate = {};
    if (req.query.from) filter.dueDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.dueDate.$lte = new Date(req.query.to);
  }

  // Auto-flag overdue deadlines
  await Deadline.updateMany(
    {
      firmId: req.user.firmId,
      status: DEADLINE_STATUS.UPCOMING,
      dueDate: { $lt: new Date() },
    },
    { $set: { status: DEADLINE_STATUS.OVERDUE } }
  );

  const [deadlines, total] = await Promise.all([
    Deadline.find(filter)
      .populate('caseId', 'title caseNumber')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Deadline.countDocuments(filter),
  ]);

  ApiResponse.success(res, {
    message: 'Deadlines retrieved',
    data: deadlines,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Get single deadline
 * @route   GET /api/deadlines/:id
 * @access  Private (firm members)
 */
export const getDeadline = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    firmId: req.user.firmId,
  };

  const deadline = await Deadline.findOne(filter).populate('caseId', 'title caseNumber assignedLawyers');

  if (!deadline) {
    throw new ApiError(404, 'Deadline not found');
  }

  // LAWYER RESTRICTION: Ensure lawyer is assigned to the case
  if (req.user.role === ROLES.LAWYER && !deadline.caseId.assignedLawyers.includes(req.user._id)) {
    throw new ApiError(403, 'Access denied to this deadline');
  }

  ApiResponse.success(res, {
    message: 'Deadline retrieved',
    data: deadline,
  });
});

/**
 * @desc    Update a deadline
 * @route   PUT /api/deadlines/:id
 * @access  Private (firm members)
 */
export const updateDeadline = asyncHandler(async (req, res) => {
  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  }).populate('caseId');

  if (!deadline) {
    throw new ApiError(404, 'Deadline not found');
  }

  // LAWYER RESTRICTION: Ensure lawyer is assigned to the case
  if (req.user.role === ROLES.LAWYER && !deadline.caseId.assignedLawyers.includes(req.user._id)) {
    throw new ApiError(403, 'Access denied: You cannot update deadlines for this case');
  }

  Object.assign(deadline, req.body);
  await deadline.save();
  await deadline.populate('caseId', 'title caseNumber');

  ApiResponse.success(res, {
    message: 'Deadline updated successfully',
    data: deadline,
  });
});

/**
 * @desc    Delete a deadline
 * @route   DELETE /api/deadlines/:id
 * @access  Private (firm members)
 */
export const deleteDeadline = asyncHandler(async (req, res) => {
  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  }).populate('caseId');

  if (!deadline) {
    throw new ApiError(404, 'Deadline not found');
  }

  // LAWYER RESTRICTION: Ensure lawyer is assigned to the case
  if (req.user.role === ROLES.LAWYER && !deadline.caseId.assignedLawyers.includes(req.user._id)) {
    throw new ApiError(403, 'Access denied: You cannot delete deadlines for this case');
  }

  await Deadline.deleteOne({ _id: deadline._id });

  ApiResponse.deleted(res, { message: 'Deadline deleted successfully' });
});

/**
 * @desc    Check for conflicting deadlines on a case
 * @route   GET /api/deadlines/conflicts/:caseId
 * @access  Private (firm members)
 */
export const getConflicts = asyncHandler(async (req, res) => {
  const deadlines = await Deadline.find({
    caseId: req.params.caseId,
    firmId: req.user.firmId,
    status: { $ne: DEADLINE_STATUS.COMPLETED },
  }).sort('dueDate');

  const conflicts = [];
  const oneHour = 60 * 60 * 1000;

  for (let i = 0; i < deadlines.length; i++) {
    for (let j = i + 1; j < deadlines.length; j++) {
      const diff = Math.abs(
        deadlines[j].dueDate.getTime() - deadlines[i].dueDate.getTime()
      );
      if (diff <= oneHour) {
        conflicts.push({
          deadline1: deadlines[i],
          deadline2: deadlines[j],
          timeDifferenceMinutes: Math.round(diff / 60000),
        });
      }
    }
  }

  ApiResponse.success(res, {
    message: conflicts.length > 0
      ? `${conflicts.length} conflict(s) found`
      : 'No conflicts found',
    data: conflicts,
  });
});
