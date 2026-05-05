import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import Case from '../models/Case.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { paginate, buildMeta } from '../utils/pagination.js';
import { ROLES } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @desc    Upload a document for a case
 * @route   POST /api/documents
 * @access  Private (firm members)
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a file');
  }

  const { caseId } = req.body;
  if (!caseId) {
    throw new ApiError(400, 'caseId is required');
  }

  // Verify the case belongs to the user's firm AND lawyer is assigned to it
  const filter = { _id: caseId, firmId: req.user.firmId };
  if (req.user.role === ROLES.LAWYER) {
    filter.assignedLawyers = req.user._id;
  }

  const caseDoc = await Case.findOne(filter);

  if (!caseDoc) {
    throw new ApiError(404, 'Case not found or access denied');
  }

  const document = await Document.create({
    caseId,
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedBy: req.user._id,
    firmId: req.user.firmId,
  });

  ApiResponse.created(res, {
    message: 'Document uploaded successfully',
    data: document,
  });
});

/**
 * @desc    Get all documents for a case (paginated)
 * @route   GET /api/documents/:caseId?page=1&limit=10&sort=-createdAt
 * @access  Private (firm members)
 */
export const getDocumentsByCase = asyncHandler(async (req, res) => {
  // Ensure the case belongs to the user's firm AND lawyer is assigned to it
  const caseFilter = { _id: req.params.caseId, firmId: req.user.firmId };
  if (req.user.role === ROLES.LAWYER) {
    caseFilter.assignedLawyers = req.user._id;
  }

  const caseDoc = await Case.findOne(caseFilter);

  if (!caseDoc) {
    throw new ApiError(404, 'Case not found or access denied');
  }

  const { skip, limit, page, sort } = paginate(req.query);
  const filter = { caseId: req.params.caseId, firmId: req.user.firmId };

  const [documents, total] = await Promise.all([
    Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Document.countDocuments(filter),
  ]);

  ApiResponse.success(res, {
    message: 'Documents retrieved',
    data: documents,
    meta: buildMeta({ total, page, limit }),
  });
});

/**
 * @desc    Delete a document (removes file from disk)
 * @route   DELETE /api/documents/:id
 * @access  Private (firm members)
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  // Lawyers can only delete documents they uploaded; admins can delete any
  if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete documents you uploaded');
  }

  await Document.deleteOne({ _id: document._id });

  // Remove file from disk (best-effort)
  const filePath = path.join(__dirname, '..', 'uploads', path.basename(document.fileUrl));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  ApiResponse.deleted(res, { message: 'Document deleted successfully' });
});
