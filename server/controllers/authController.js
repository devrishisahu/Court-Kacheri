import User from '../models/User.js';
import Firm from '../models/Firm.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * @desc    Register a new user (optionally creates a firm)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, firmName, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'A user with this email already exists');
  }

  // Strictly use role from body. If not provided, fallback to logic.
  const validRoles = ['admin', 'lawyer', 'client']; // Removed super_admin
  let finalRole = role;

  if (finalRole && !validRoles.includes(finalRole)) {
    if (finalRole === 'super_admin') {
      throw new ApiError(403, 'Super Admin accounts cannot be created via public registration');
    }
    throw new ApiError(400, `Invalid role: ${finalRole}`);
  }

  if (!finalRole) {
    finalRole = firmName ? 'admin' : 'lawyer';
  }

  const user = await User.create({ name, email, password, role: finalRole });

  // If the user wants to create a new firm (admin flow)
  if (firmName) {
    const firm = await Firm.create({ name: firmName, createdBy: user._id });
    user.firmId = firm._id;
    await user.save();
  }

  const token = user.generateToken();

  ApiResponse.created(res, {
    message: 'User registered successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      firmId: user.firmId,
      token,
    },
  });
});

/**
 * @desc    Login user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  // Fetch user WITH password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated by the super admin');
  }

  const token = user.generateToken();

  const responseData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    firmId: user.firmId,
    token,
  };

  // Add flag message if user is flagged
  if (user.isFlagged) {
    responseData.flagMessage = 'You have been flagged by the super admin. Please contact the authority.';
  }

  ApiResponse.success(res, {
    message: 'Login successful',
    data: responseData,
  });
});

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('firmId', 'name');

  ApiResponse.success(res, {
    message: 'User profile retrieved',
    data: user,
  });
});
