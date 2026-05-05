import mongoose from 'mongoose';
import Case from '../models/Case.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ALL_CASE_STATUSES, ROLES } from '../config/constants.js';

/**
 * @desc    Create a new case
 * @route   POST /api/cases
 * @access  Private (firm members)
 */
export const createCase = asyncHandler(async (req, res) => {
  const newCase = await Case.create({
    ...req.body,
    firmId: req.user.firmId,
  });

  ApiResponse.created(res, {
    message: 'Case created successfully',
    data: newCase,
  });
});

/**
 * @desc    Get all cases for the user's firm (paginated, filterable, sortable)
 * @route   GET /api/cases?page=1&limit=10&status=open&search=land&sort=-createdAt
 * @access  Private (firm members)
 */
export const getCases = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = paginate(req.query);
  const filter = { firmId: req.user.firmId };

  // LAWYER RESTRICTION: Lawyers only see cases assigned to them
  if (req.user.role === ROLES.LAWYER) {
    filter.assignedLawyers = req.user._id;
  }

  // CLIENT RESTRICTION: Clients only see their own cases
  if (req.user.role === ROLES.CLIENT) {
    filter.clientId = req.user._id;
  }

  // Optional status filter
  if (req.query.status && ALL_CASE_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  // Optional search by title
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  // Optional filter by client
  if (req.query.clientId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.clientId)) {
      throw new ApiError(400, 'Invalid clientId format');
    }
    filter.clientId = req.query.clientId;
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
    message: 'Cases retrieved',
    data: cases,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Get single case by ID
 * @route   GET /api/cases/:id
 * @access  Private (firm members)
 */
export const getCase = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    firmId: req.user.firmId,
  };

  // LAWYER RESTRICTION: Lawyers can only access cases assigned to them
  if (req.user.role === ROLES.LAWYER) {
    filter.assignedLawyers = req.user._id;
  }

  // CLIENT RESTRICTION: Clients can only access their own cases
  if (req.user.role === ROLES.CLIENT) {
    filter.clientId = req.user._id;
  }

  const foundCase = await Case.findOne(filter)
    .populate('clientId', 'name email phone')
    .populate('assignedLawyers', 'name email role');

  if (!foundCase) {
    throw new ApiError(404, 'Case not found or access denied');
  }

  ApiResponse.success(res, {
    message: 'Case retrieved',
    data: foundCase,
  });
});

/**
 * @desc    Update a case
 * @route   PUT /api/cases/:id
 * @access  Private (firm members)
 */
export const updateCase = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, firmId: req.user.firmId };
  
  // Lawyer can only update cases assigned to them
  if (req.user.role === ROLES.LAWYER) {
    filter.assignedLawyers = req.user._id;
  }

  const updatedCase = await Case.findOneAndUpdate(
    filter,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('clientId', 'name email')
    .populate('assignedLawyers', 'name email');

  if (!updatedCase) {
    throw new ApiError(404, 'Case not found');
  }

  ApiResponse.success(res, {
    message: 'Case updated successfully',
    data: updatedCase,
  });
});

/**
 * @desc    Delete a case
 * @route   DELETE /api/cases/:id
 * @access  Private (firm members)
 */
export const deleteCase = asyncHandler(async (req, res) => {
  const deletedCase = await Case.findOneAndDelete({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!deletedCase) {
    throw new ApiError(404, 'Case not found');
  }

  ApiResponse.deleted(res, { message: 'Case deleted successfully' });
});
