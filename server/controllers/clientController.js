import Client from '../models/Client.js';
import Case from '../models/Case.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ROLES } from '../config/constants.js';

/**
 * @desc    Create a new client
 * @route   POST /api/clients
 * @access  Private (firm members)
 */
export const createClient = asyncHandler(async (req, res) => {
  const { name, email, phone, userId } = req.body;
  const firmId = req.user.firmId;

  if (!firmId && req.user.role !== 'admin') {
    throw new ApiError(403, 'You must belong to a firm to add clients');
  }

  // If userId is provided, ensure they aren't already a client in this firm
  if (userId) {
    const existingByUser = await Client.findOne({ userId, firmId });
    if (existingByUser) {
      return ApiResponse.success(res, {
        message: 'This user is already in your client base',
        data: existingByUser,
      });
    }
  } else if (email) {
    // If only email provided, check for duplicate email in firm
    const existingByEmail = await Client.findOne({ email, firmId });
    if (existingByEmail) {
      return ApiResponse.success(res, {
        message: 'A client with this email already exists in your firm',
        data: existingByEmail,
      });
    }
  }

  const client = await Client.create({
    name,
    email,
    phone,
    userId,
    firmId,
  });

  ApiResponse.created(res, {
    message: 'Client added to firm base',
    data: client,
  });
});

/**
 * @desc    Get all clients for the user's firm (paginated, searchable, sortable)
 * @route   GET /api/clients?page=1&limit=10&search=john&sort=name
 * @access  Private (firm members)
 */
export const getClients = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = paginate(req.query);
  const filter = { firmId: req.user.firmId };

  // LAWYER RESTRICTION: Removed to allow lawyers to see firm's client base for direct chat
  // if (req.user.role === ROLES.LAWYER) {
  //   const lawyerCases = await Case.find({
  //     firmId: req.user.firmId,
  //     assignedLawyers: req.user._id,
  //   }).select('clientId');
  //   const clientIds = lawyerCases.map((c) => c.clientId);
  //   filter._id = { $in: clientIds };
  // }

  // Optional search by name
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [clients, total] = await Promise.all([
    Client.find(filter).sort(sort).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);

  ApiResponse.success(res, {
    message: 'Clients retrieved',
    data: clients,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Get single client by ID
 * @route   GET /api/clients/:id
 * @access  Private (firm members)
 */
export const getClient = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    firmId: req.user.firmId,
  };

  // LAWYER RESTRICTION: Verify lawyer is assigned to at least one case of this client
  if (req.user.role === ROLES.LAWYER) {
    const caseExists = await Case.exists({
      firmId: req.user.firmId,
      clientId: req.params.id,
      assignedLawyers: req.user._id,
    });
    if (!caseExists) {
      throw new ApiError(403, 'Access denied to this client');
    }
  }

  const client = await Client.findOne(filter);

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  ApiResponse.success(res, {
    message: 'Client retrieved',
    data: client,
  });
});

/**
 * @desc    Update a client
 * @route   PUT /api/clients/:id
 * @access  Private (firm members)
 */
export const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndUpdate(
    { _id: req.params.id, firmId: req.user.firmId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  ApiResponse.success(res, {
    message: 'Client updated successfully',
    data: client,
  });
});

/**
 * @desc    Delete a client
 * @route   DELETE /api/clients/:id
 * @access  Private (firm members)
 */
export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findOneAndDelete({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!client) {
    throw new ApiError(404, 'Client not found');
  }

  ApiResponse.deleted(res, { message: 'Client deleted successfully' });
});
