import Firm from '../models/Firm.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/**
 * @desc    Get all active firms with lawyer count
 * @route   GET /api/public/firms
 * @access  Private (Client, Super Admin)
 */
export const getPublicFirms = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isActive: true };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  // Aggregate to get lawyer counts
  const firms = await Firm.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'firmId',
        as: 'lawyers',
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        isActive: 1,
        rating: 1,
        lawyerCount: {
          $size: {
            $filter: {
              input: '$lawyers',
              as: 'l',
              cond: { $in: ['$$l.role', [ROLES.LAWYER, ROLES.ADMIN]] }
            }
          }
        }
      }
    }
  ]);

  ApiResponse.success(res, {
    message: 'Active firms retrieved',
    data: firms,
  });
});

/**
 * @desc    Get active lawyers for a specific firm
 * @route   GET /api/public/firms/:firmId/lawyers
 * @access  Private (Client, Super Admin)
 */
export const getPublicLawyers = asyncHandler(async (req, res) => {
  const { firmId } = req.params;

  const lawyers = await User.find({
    firmId,
    role: { $in: [ROLES.LAWYER, ROLES.ADMIN] },
    isActive: true,
  }).select('name role isActive createdAt'); // Expose limited fields

  ApiResponse.success(res, {
    message: 'Firm lawyers retrieved',
    data: lawyers,
  });
});

/**
 * @desc    Get all active lawyers across all firms
 * @route   GET /api/public/lawyers
 * @access  Private (Client, Super Admin)
 */
export const getAllPublicLawyers = asyncHandler(async (req, res) => {
  const lawyers = await User.find({
    role: { $in: [ROLES.LAWYER, ROLES.ADMIN] },
    isActive: true,
  })
    .populate('firmId', 'name')
    .select('name role isActive createdAt firmId');

  ApiResponse.success(res, {
    message: 'All active lawyers retrieved',
    data: lawyers,
  });
});
