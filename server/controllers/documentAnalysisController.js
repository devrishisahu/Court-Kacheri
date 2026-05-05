import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import DocumentAnalysis from '../models/DocumentAnalysis.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { analyzeDocument } from '../utils/aiAnalyzer.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Safely delete a file from disk (best-effort, non-blocking)
 */
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Cleaned up file: ${path.basename(filePath)}`);
    }
  } catch (err) {
    logger.warn(`Failed to clean up file: ${filePath}`, { error: err.message });
  }
};

/**
 * @desc    Trigger Gemini AI analysis for an uploaded PDF document
 * @route   POST /api/documents/:id/analyze
 * @access  Private (firm members)
 */
export const analyzeDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!document) throw new ApiError(404, 'Document not found');

  if (document.mimeType !== 'application/pdf') {
    throw new ApiError(400, 'AI analysis is only available for PDF documents');
  }

  // Return cached completed analysis
  const existing = await DocumentAnalysis.findOne({ documentId: document._id });
  if (existing && existing.status === 'completed') {
    return ApiResponse.success(res, {
      message: 'Analysis retrieved from cache',
      data: existing,
    });
  }

  // Create or reset analysis record
  let analysis = existing || new DocumentAnalysis({
    documentId: document._id,
    caseId: document.caseId,
    firmId: document.firmId,
  });

  analysis.status = 'processing';
  analysis.errorMessage = undefined;
  await analysis.save();

  // Verify the PDF file exists on disk
  const filePath = path.join(__dirname, '..', 'uploads', path.basename(document.fileUrl));
  if (!fs.existsSync(filePath)) {
    analysis.status = 'failed';
    analysis.errorMessage = 'PDF file not found on server disk';
    await analysis.save();
    throw new ApiError(404, 'The uploaded PDF file could not be found on the server.');
  }

  // Send the raw PDF directly to Gemini's multimodal API — no pdf-parse needed
  let aiResult;
  try {
    aiResult = await analyzeDocument(filePath, document.fileName);
  } catch (err) {
    analysis.status = 'failed';
    analysis.errorMessage = err.message;
    await analysis.save();
    logger.error('Gemini analysis failed', { documentId: document._id, error: err.message });
    // Clean up the file even on failure — analysis can be re-triggered by re-uploading
    cleanupFile(filePath);
    throw new ApiError(500, `AI analysis failed: ${err.message}`);
  }

  // Persist completed result
  analysis.status = 'completed';
  
  // Guard against Gemini randomly renaming the JSON keys
  analysis.executiveSummary = aiResult.executiveSummary || aiResult.summary || aiResult.description || 'Executive summary was omitted by the AI.';
  analysis.documentType = aiResult.documentType || 'Legal Document';
  
  // Guard against missing properties in array items
  analysis.clauses = (aiResult.clauses || []).map(c => ({
    title: c.title || c.name || 'Extracted Clause',
    content: c.content || c.description || 'No specific content parsed.',
    importance: ['critical', 'high', 'medium', 'low'].includes(String(c.importance).toLowerCase()) ? String(c.importance).toLowerCase() : 'medium',
    category: ['charge','obligation','deadline','penalty','right','definition','party','jurisdiction','evidence','other'].includes(String(c.category).toLowerCase()) ? String(c.category).toLowerCase() : 'other'
  }));

  analysis.parties = aiResult.parties || [];
  analysis.keyDates = aiResult.keyDates || [];
  analysis.legalReferences = aiResult.legalReferences || [];
  analysis.actionItems = aiResult.actionItems || [];
  
  analysis.riskLevel = ['critical', 'high', 'medium', 'low'].includes(String(aiResult.riskLevel).toLowerCase()) 
    ? String(aiResult.riskLevel).toLowerCase() 
    : 'medium';
    
  analysis.riskRationale = aiResult.riskRationale || aiResult.rationale || 'No rationale provided.';
  analysis.processingTimeMs = aiResult.processingTimeMs;
  analysis.tokensUsed = aiResult.tokensUsed;
  analysis.analyzedAt = new Date();

  await analysis.save();

  logger.info(`Gemini analysis completed for document ${document._id} in ${aiResult.processingTimeMs}ms — ${aiResult.tokensUsed} tokens used`);

  ApiResponse.success(res, {
    message: 'Document analyzed successfully by Gemini AI',
    data: analysis,
  });

  // Clean up the physical file — analysis is now stored in DB
  cleanupFile(filePath);
});

/**
 * @desc    Get existing Gemini analysis for a document
 * @route   GET /api/documents/:id/analysis
 * @access  Private (firm members)
 */
export const getDocumentAnalysis = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!document) throw new ApiError(404, 'Document not found');

  const analysis = await DocumentAnalysis.findOne({ documentId: document._id });

  ApiResponse.success(res, {
    message: analysis ? 'Analysis retrieved' : 'No analysis found for this document',
    data: analysis || null,
  });
});

/**
 * @desc    Clear cached analysis so it can be re-run
 * @route   DELETE /api/documents/:id/analysis
 * @access  Private (admin only)
 */
export const deleteDocumentAnalysis = asyncHandler(async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    firmId: req.user.firmId,
  });

  if (!document) throw new ApiError(404, 'Document not found');

  await DocumentAnalysis.deleteOne({ documentId: document._id });

  ApiResponse.deleted(res, {
    message: 'Analysis cleared — document can now be re-analyzed',
  });
});
