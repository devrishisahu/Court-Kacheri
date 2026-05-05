import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Firm from '../models/Firm.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Login or Register with Google
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { credential, role, firmName } = req.body;

  if (!credential) {
    throw new ApiError(400, 'Google credential is required');
  }

  // 1. Verify the Google ID token
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new ApiError(401, 'Invalid Google token');
  }

  const { sub: googleId, email, name, picture } = payload;

  // 2. Check if user already exists (by googleId or email)
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Existing user — link Google ID if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated by the super admin');
    }
  } else {
    // 3. New user — register them
    const validRoles = ['admin', 'lawyer', 'client'];
    let finalRole = role;

    if (finalRole && !validRoles.includes(finalRole)) {
      if (finalRole === 'super_admin') {
        throw new ApiError(403, 'Super Admin accounts cannot be created via Google sign-in');
      }
      throw new ApiError(400, `Invalid role: ${finalRole}`);
    }

    if (!finalRole) {
      finalRole = firmName ? 'admin' : 'client';
    }

    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      role: finalRole,
    });

    // If admin wants to create a firm
    if (firmName?.trim()) {
      const firm = await Firm.create({ name: firmName.trim(), createdBy: user._id });
      user.firmId = firm._id;
      await user.save();
    }
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

  if (user.isFlagged) {
    responseData.flagMessage = 'You have been flagged by the super admin. Please contact the authority.';
  }

  ApiResponse.success(res, {
    message: 'Google authentication successful',
    data: responseData,
  });
});
