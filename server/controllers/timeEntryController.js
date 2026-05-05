import mongoose from 'mongoose';
import TimeEntry from '../models/TimeEntry.js';
import Case from '../models/Case.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ROLES } from '../config/constants.js';

/**
 * @desc    Start a timer for a case
 * @route   POST /api/time-entries/start
 * @access  Private (firm members)
 */
export const startTimer = asyncHandler(async (req, res) => {
  const { caseId, description, billable } = req.body;

  // Verify case belongs to user's firm
  const caseDoc = await Case.findOne({ _id: caseId, firmId: req.user.firmId });
  if (!caseDoc) {
    throw new ApiError(404, 'Case not found in your firm');
  }

  // Check if user already has a running timer
  const running = await TimeEntry.findOne({
    userId: req.user._id,
    endTime: null,
    firmId: req.user.firmId,
  });

  if (running) {
    throw new ApiError(400, 'You already have a running timer. Stop it before starting a new one.');
  }

  const entry = await TimeEntry.create({
    caseId,
    userId: req.user._id,
    startTime: new Date(),
    description,
    billable: billable !== undefined ? billable : true,
    firmId: req.user.firmId,
  });

  ApiResponse.created(res, {
    message: 'Timer started',
    data: entry,
  });
});

/**
 * @desc    Stop a running timer
 * @route   POST /api/time-entries/:id/stop
 * @access  Private (firm members)
 */
export const stopTimer = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
    userId: req.user._id,
  });

  if (!entry) {
    throw new ApiError(404, 'Time entry not found');
  }

  if (entry.endTime) {
    throw new ApiError(400, 'This timer has already been stopped');
  }

  entry.endTime = new Date();
  entry.duration = Math.round(
    (entry.endTime.getTime() - entry.startTime.getTime()) / 60000
  ); // minutes

  // Allow optional description update when stopping
  if (req.body.description) {
    entry.description = req.body.description;
  }

  await entry.save();

  ApiResponse.success(res, {
    message: `Timer stopped — ${entry.duration} minutes recorded`,
    data: entry,
  });
});

/**
 * @desc    Get time entries (paginated, filterable)
 * @route   GET /api/time-entries?caseId=xxx&userId=xxx&from=2024-01-01&to=2024-12-31&billable=true
 * @access  Private (firm members)
 */
export const getTimeEntries = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = paginate(req.query);
  const filter = { firmId: req.user.firmId };

  // LAWYER RESTRICTION: Only see your own entries or entries for cases you are assigned to
  if (req.user.role === ROLES.LAWYER) {
    const lawyerCases = await Case.find({
      firmId: req.user.firmId,
      assignedLawyers: req.user._id,
    }).select('_id');
    const caseIds = lawyerCases.map((c) => c._id);
    
    filter.$or = [
      { userId: req.user._id },
      { caseId: { $in: caseIds } }
    ];
  }

  if (req.query.caseId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.caseId)) {
      throw new ApiError(400, 'Invalid caseId format');
    }
    // If lawyer provided caseId, it must be in their assigned list
    if (req.user.role === ROLES.LAWYER) {
       const caseAssigned = await Case.exists({ _id: req.query.caseId, assignedLawyers: req.user._id });
       if (!caseAssigned) throw new ApiError(403, 'Access denied to this case');
    }
    filter.caseId = req.query.caseId;
  }
  if (req.query.userId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
      throw new ApiError(400, 'Invalid userId format');
    }
    // If lawyer is looking for another user's entries, it's generally not allowed unless they share a case,
    // but for simplicity, let's just say lawyers can only filter for themselves if they provide userId.
    if (req.user.role === ROLES.LAWYER && req.query.userId !== req.user._id.toString()) {
       throw new ApiError(403, 'You can only view your own time entries');
    }
    filter.userId = req.query.userId;
  }
  if (req.query.billable !== undefined) filter.billable = req.query.billable === 'true';

  // Date range on startTime
  if (req.query.from || req.query.to) {
    filter.startTime = {};
    if (req.query.from) filter.startTime.$gte = new Date(req.query.from);
    if (req.query.to) filter.startTime.$lte = new Date(req.query.to);
  }

  const [entries, total] = await Promise.all([
    TimeEntry.find(filter)
      .populate('caseId', 'title caseNumber')
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    TimeEntry.countDocuments(filter),
  ]);

  ApiResponse.success(res, {
    message: 'Time entries retrieved',
    data: entries,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Get time summary for a case (total hours, billable hours)
 * @route   GET /api/time-entries/summary/:caseId
 * @access  Private (firm members)
 */
export const getCaseSummary = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findOne({
    _id: req.params.caseId,
    firmId: req.user.firmId,
  });

  if (!caseDoc) {
    throw new ApiError(404, 'Case not found in your firm');
  }

  const [summary] = await TimeEntry.aggregate([
    {
      $match: {
        caseId: caseDoc._id,
        firmId: req.user.firmId,
        endTime: { $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
        billableMinutes: {
          $sum: { $cond: ['$billable', '$duration', 0] },
        },
        entryCount: { $sum: 1 },
      },
    },
  ]);

  const data = summary || { totalMinutes: 0, billableMinutes: 0, entryCount: 0 };

  ApiResponse.success(res, {
    message: 'Time summary retrieved',
    data: {
      caseId: caseDoc._id,
      caseNumber: caseDoc.caseNumber,
      totalHours: +(data.totalMinutes / 60).toFixed(2),
      billableHours: +(data.billableMinutes / 60).toFixed(2),
      totalEntries: data.entryCount,
    },
  });
});

/**
 * @desc    Delete a time entry
 * @route   DELETE /api/time-entries/:id
 * @access  Private (firm members)
 */
export const deleteTimeEntry = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!entry) {
    throw new ApiError(404, 'Time entry not found');
  }

  if (req.user.role !== 'admin' && entry.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own time entries');
  }

  await TimeEntry.deleteOne({ _id: entry._id });

  ApiResponse.deleted(res, { message: 'Time entry deleted successfully' });
});
