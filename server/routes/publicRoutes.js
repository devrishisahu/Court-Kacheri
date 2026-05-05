import { Router } from 'express';
import { authMiddleware, checkRole } from '../middleware/auth.js';
import { getPublicFirms, getPublicLawyers, getAllPublicLawyers } from '../controllers/publicController.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Restricted to clients and super admins
router.use(authMiddleware, checkRole(ROLES.CLIENT, ROLES.SUPER_ADMIN));

router.get('/firms', getPublicFirms);
router.get('/firms/:firmId/lawyers', getPublicLawyers);
router.get('/lawyers', getAllPublicLawyers);

export default router;
