import express from 'express';
import {
  getAllUsers,
  toggleUserStatus,
  toggleUserFlag,
  getAllFirms,
  getFirmLawyers,
} from '../controllers/superAdminController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes here require being a logged-in Super Admin
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/flag', toggleUserFlag);

// Firm Management
router.get('/firms', getAllFirms);
router.get('/firms/:id/lawyers', getFirmLawyers);

export default router;
