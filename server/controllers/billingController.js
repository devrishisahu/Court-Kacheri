import mongoose from 'mongoose';
import Billing from '../models/Billing.js';
import TimeEntry from '../models/TimeEntry.js';
import Case from '../models/Case.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ALL_BILLING_STATUSES, ROLES } from '../config/constants.js';

/**
 * @desc    Create an invoice (optionally auto-generate from time entries)
 * @route   POST /api/billing
 * @access  Private (admin only)
 *
 * Body:
 *   { caseId, clientId, items?, rate?, dueDate, notes }
 *   If `items` is empty and `rate` is provided, auto-generate from billable time entries.
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const { caseId, clientId, items, rate, dueDate, notes } = req.body;

  // Verify case belongs to firm
  const caseDoc = await Case.findOne({ _id: caseId, firmId: req.user.firmId });
  if (!caseDoc) {
    throw new ApiError(404, 'Case not found in your firm');
  }

  let invoiceItems = items || [];

  // Auto-generate items from unbilled time entries
  if (invoiceItems.length === 0 && rate) {
    const entries = await TimeEntry.find({
      caseId,
      firmId: req.user.firmId,
      billable: true,
      billed: false,
      endTime: { $ne: null },
    }).populate('userId', 'name');

    if (entries.length === 0) {
      throw new ApiError(400, 'No billable time entries found for this case');
    }

    invoiceItems = entries.map((e) => ({
      description: e.description || `Time entry by ${e.userId?.name || 'Unknown'}`,
      hours: +(e.duration / 60).toFixed(2),
      rate: Number(rate),
      amount: +((e.duration / 60) * Number(rate)).toFixed(2),
    }));
  }

  const billing = await Billing.create({
    caseId,
    clientId,
    items: invoiceItems,
    dueDate,
    notes,
    firmId: req.user.firmId,
  });

  // Flag time entries as billed
  if (invoiceItems.length > 0 && rate && entries && entries.length > 0) {
    const entryIds = entries.map((e) => e._id);
    await TimeEntry.updateMany({ _id: { $in: entryIds } }, { $set: { billed: true } });
  }

  ApiResponse.created(res, {
    message: 'Invoice created successfully',
    data: billing,
  });
});

/**
 * @desc    Get all invoices (paginated, filterable)
 * @route   GET /api/billing?status=draft&caseId=xxx&clientId=xxx&sort=-createdAt
 * @access  Private (firm members)
 */
export const getInvoices = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = paginate(req.query);
  const filter = { firmId: req.user.firmId };

  // CLIENT RESTRICTION: Only see your own invoices
  if (req.user.role === ROLES.CLIENT) {
    filter.clientId = req.user._id;
  }

  if (req.query.status && ALL_BILLING_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.caseId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.caseId)) {
      throw new ApiError(400, 'Invalid caseId format');
    }
    // If lawyer provided caseId, it must be in their assigned list
    if (filter.caseId && !filter.caseId.$in.some(id => id.toString() === req.query.caseId)) {
       throw new ApiError(403, 'Access denied to this case billing');
    }
    filter.caseId = req.query.caseId;
  }
  if (req.query.clientId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.clientId)) {
      throw new ApiError(400, 'Invalid clientId format');
    }
    filter.clientId = req.query.clientId;
  }

  const [invoices, total] = await Promise.all([
    Billing.find(filter)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Billing.countDocuments(filter),
  ]);

  ApiResponse.success(res, {
    message: 'Invoices retrieved',
    data: invoices,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Get single invoice
 * @route   GET /api/billing/:id
 * @access  Private (firm members)
 */
export const getInvoice = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    firmId: req.user.firmId,
  };

  const invoice = await Billing.findOne(filter)
    .populate('caseId', 'title caseNumber assignedLawyers')
    .populate('clientId', 'name email phone');

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  // CLIENT RESTRICTION: Ensure client owns this invoice
  if (req.user.role === ROLES.CLIENT && invoice.clientId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied to this invoice');
  }

  ApiResponse.success(res, {
    message: 'Invoice retrieved',
    data: invoice,
  });
});

/**
 * @desc    Update an invoice
 * @route   PUT /api/billing/:id
 * @access  Private (admin only)
 */
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Billing.findOneAndUpdate(
    { _id: req.params.id, firmId: req.user.firmId },
    req.body,
    { new: true, runValidators: true }
  )
    .populate('caseId', 'title caseNumber')
    .populate('clientId', 'name email');

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  ApiResponse.success(res, {
    message: 'Invoice updated successfully',
    data: invoice,
  });
});

/**
 * @desc    Change invoice status
 * @route   PUT /api/billing/:id/status
 * @access  Private (admin only)
 */
export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !ALL_BILLING_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${ALL_BILLING_STATUSES.join(', ')}`);
  }

  const invoice = await Billing.findOneAndUpdate(
    { _id: req.params.id, firmId: req.user.firmId },
    { status },
    { new: true }
  );

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  ApiResponse.success(res, {
    message: `Invoice status updated to '${status}'`,
    data: invoice,
  });
});

/**
 * @desc    Delete an invoice
 * @route   DELETE /api/billing/:id
 * @access  Private (admin only)
 */
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Billing.findOneAndDelete({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!invoice) {
    throw new ApiError(404, 'Invoice not found');
  }

  ApiResponse.deleted(res, { message: 'Invoice deleted successfully' });
});

/**
 * @desc    Get revenue summary for the firm
 * @route   GET /api/billing/summary
 * @access  Private (admin only)
 */
export const getRevenueSummary = asyncHandler(async (req, res) => {
  const allSummary = await Billing.aggregate([
    { $match: { firmId: req.user.firmId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$totalAmount' },
      },
    },
  ]);

  const result = {
    byStatus: {},
    grandTotal: 0,
    invoiceCount: 0,
  };

  for (const s of allSummary) {
    result.byStatus[s._id] = { count: s.count, total: s.total };
    result.grandTotal += s.total;
    result.invoiceCount += s.count;
  }

  ApiResponse.success(res, {
    message: 'Revenue summary retrieved',
    data: result,
  });
});
