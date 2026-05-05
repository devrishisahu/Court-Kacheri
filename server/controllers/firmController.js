import Firm from '../models/Firm.js';
import User from '../models/User.js';
import Invite from '../models/Invite.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * @desc    Create a new firm and assign it to the logged-in user
 * @route   POST /api/firms/create
 * @access  Private
 */
export const createFirm = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, 'Firm name is required');
  }

  // Prevent user from creating multiple firms
  if (req.user.firmId) {
    throw new ApiError(400, 'You already belong to a firm');
  }

  const firm = await Firm.create({ name, createdBy: req.user._id });

  // Attach firm to the user
  await User.findByIdAndUpdate(req.user._id, { firmId: firm._id });

  ApiResponse.created(res, {
    message: 'Firm created successfully',
    data: firm,
  });
});

/**
 * @desc    Get the firm of the currently logged-in user
 * @route   GET /api/firms/me
 * @access  Private
 */
export const getMyFirm = asyncHandler(async (req, res) => {
  if (!req.user.firmId) {
    throw new ApiError(404, 'You are not associated with any firm');
  }

  const firm = await Firm.findById(req.user.firmId).populate(
    'createdBy',
    'name email'
  );

  if (!firm) {
    throw new ApiError(404, 'Firm not found');
  }

  ApiResponse.success(res, {
    message: 'Firm retrieved',
    data: firm,
  });
});

/**
 * @desc    Invite a lawyer by email
 * @route   POST /api/firms/invites
 * @access  Private (Admin only)
 */
export const inviteLawyer = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new ApiError(403, 'Only admins can invite lawyers');
  
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const firmId = req.user.firmId;
  if (!firmId) throw new ApiError(400, 'You do not belong to a firm');

  const existingInvite = await Invite.findOne({ firmId, email, status: 'pending' });
  if (existingInvite) throw new ApiError(400, 'An invite is already pending for this email');

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.firmId) {
    if (existingUser.firmId.toString() === firmId.toString()) {
      throw new ApiError(400, 'User is already in your firm');
    }
    throw new ApiError(400, 'User already belongs to another firm');
  }

  const invite = await Invite.create({
    firmId,
    invitedBy: req.user._id,
    email,
  });

  ApiResponse.created(res, { message: 'Invite sent', data: invite });
});

/**
 * @desc    Get pending invites for the logged in lawyer
 * @route   GET /api/firms/invites/me
 * @access  Private
 */
export const getMyInvites = asyncHandler(async (req, res) => {
  const invites = await Invite.find({ email: req.user.email, status: 'pending' })
    .populate('firmId', 'name')
    .populate('invitedBy', 'name');
    
  ApiResponse.success(res, { message: 'Invites retrieved', data: invites });
});

/**
 * @desc    Lawyer responds to an invite (accept/reject)
 * @route   PUT /api/firms/invites/:id/respond
 * @access  Private
 */
export const respondInvite = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) throw new ApiError(400, 'Invalid status');

  const invite = await Invite.findById(req.params.id);
  if (!invite || invite.email !== req.user.email) throw new ApiError(404, 'Invite not found');

  if (invite.status !== 'pending') throw new ApiError(400, `Invite already ${invite.status}`);

  invite.status = status;
  await invite.save();

  if (status === 'accepted') {
    req.user.firmId = invite.firmId;
    await req.user.save();
    
    await Invite.updateMany(
      { email: req.user.email, status: 'pending', _id: { $ne: invite._id } },
      { $set: { status: 'rejected' } }
    );
  }

  ApiResponse.success(res, { message: `Invite ${status}`, data: invite });
});

/**
 * @desc    Get firm's sent invites
 * @route   GET /api/firms/invites
 * @access  Private (Admin only)
 */
export const getFirmInvites = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new ApiError(403, 'Not authorized');
  const invites = await Invite.find({ firmId: req.user.firmId }).sort('-createdAt');
  ApiResponse.success(res, { message: 'Firm invites', data: invites });
});

/**
 * @desc    Get all lawyers in the firm
 * @route   GET /api/firms/lawyers
 * @access  Private (Admin only)
 */
export const getFirmLawyers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new ApiError(403, 'Not authorized');
  const lawyers = await User.find({ firmId: req.user.firmId, role: 'lawyer' }).select('name email');
  ApiResponse.success(res, { message: 'Firm lawyers', data: lawyers });
});

/**
 * @desc    Search for users with role 'client'
 * @route   GET /api/firms/search-registered-clients?query=...
 * @access  Private (Admin/Lawyer only)
 */
export const searchRegisteredClients = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return ApiResponse.success(res, { data: [] });
  }

  const users = await User.find({
    role: 'client',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
  .select('name email _id')
  .limit(10);

  ApiResponse.success(res, {
    message: 'Registered clients found',
    data: users
  });
});
