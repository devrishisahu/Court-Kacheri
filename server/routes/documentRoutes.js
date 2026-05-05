import { Router } from 'express';
import { authMiddleware, requireFirm, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  uploadDocument,
  getDocumentsByCase,
  deleteDocument,
} from '../controllers/documentController.js';
import {
  analyzeDocumentById,
  getDocumentAnalysis,
  deleteDocumentAnalysis,
} from '../controllers/documentAnalysisController.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authMiddleware, requireFirm);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/', upload.single('file'), uploadDocument);
router.get('/:caseId', getDocumentsByCase);
router.delete('/:id', deleteDocument);

router.get('/file/:filename', async (req, res) => {
  // Verify the document belongs to the user's firm
  const doc = await Document.findOne({
    fileUrl: `/uploads/${req.params.filename}`,
    firmId: req.user.firmId,
  });
  if (!doc) throw new ApiError(403, 'Access denied');

  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'File not found');

  res.sendFile(filePath);
});

// AI Analysis Routes
router.post('/:id/analyze', analyzeDocumentById);
router.get('/:id/analysis', getDocumentAnalysis);
router.delete('/:id/analysis', authorize(ROLES.ADMIN), deleteDocumentAnalysis);

export default router;
