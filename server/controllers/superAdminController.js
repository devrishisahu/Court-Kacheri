import User from '../models/User.js';
import Firm from '../models/Firm.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ROLES } from '../config/constants.js';

/**
 * @desc    Get all users (paginated, filterable)
 * @route   GET /api/admin/users
 * @access  Private (Super Admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = paginate(req.query);
  const filter = {};

  // Filters
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
  if (req.query.isFlagged) filter.isFlagged = req.query.isFlagged === 'true';
  
  // Search by name or email
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  ApiResponse.success(res, {
    message: 'Users retrieved successfully',
    data: users,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Toggle user active status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Super Admin)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent self-deactivation
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own super admin account');
  }

  user.isActive = !user.isActive;
  await user.save();

  ApiResponse.success(res, {
    message: `User status updated to ${user.isActive ? 'active' : 'inactive'}`,
    data: user,
  });
});

/**
 * @desc    Toggle user flag status
 * @route   PATCH /api/admin/users/:id/flag
 * @access  Private (Super Admin)
 */
export const toggleUserFlag = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isFlagged = !user.isFlagged;
  await user.save();

  ApiResponse.success(res, {
    message: `User flag status updated to ${user.isFlagged ? 'flagged' : 'unflagged'}`,
    data: user,
  });
});

/**
 * @desc    Get all firms (for Super Admin)
 * @route   GET /api/admin/firms
 * @access  Private (Super Admin)
 */
export const getAllFirms = asyncHandler(async (req, res) => {
  const firms = await Firm.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'firmId',
        as: 'members',
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        isActive: 1,
        createdAt: 1,
        lawyerCount: {
          $size: {
            $filter: {
              input: '$members',
              as: 'm',
              cond: { $eq: ['$$m.role', ROLES.LAWYER] }
            }
          }
        },
        admin: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$members',
                as: 'm',
                cond: { $eq: ['$$m.role', ROLES.ADMIN] }
              }
            },
            0
          ]
        }
      }
    },
    {
      $project: {
        name: 1,
        description: 1,
        isActive: 1,
        createdAt: 1,
        lawyerCount: 1,
        adminName: '$admin.name',
        adminEmail: '$admin.email'
      }
    }
  ]);

  ApiResponse.success(res, {
    message: 'All firms retrieved',
    data: firms,
  });
});

/**
 * @desc    Get lawyers under a firm (for Super Admin)
 * @route   GET /api/admin/firms/:id/lawyers
 * @access  Private (Super Admin)
 */
export const getFirmLawyers = asyncHandler(async (req, res) => {
  const lawyers = await User.find({
    firmId: req.params.id,
    role: ROLES.LAWYER,
  }).select('name email isActive createdAt');

  ApiResponse.success(res, {
    message: 'Firm lawyers retrieved',
    data: lawyers,
  });
});
