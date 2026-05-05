import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import sanitize from '../middleware/sanitize.js';
import { createFirm, getMyFirm, inviteLawyer, getMyInvites, respondInvite, getFirmInvites, getFirmLawyers, searchRegisteredClients } from '../controllers/firmController.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/create',
  sanitize,
  [body('name').trim().notEmpty().withMessage('Firm name is required')],
  validate,
  createFirm
);

router.get('/me', getMyFirm);

router.post('/invites', sanitize, [body('email').isEmail().withMessage('Valid email required')], validate, inviteLawyer);
router.get('/invites', getFirmInvites);
router.get('/invites/me', getMyInvites);
router.put('/invites/:id/respond', respondInvite);

router.get('/lawyers', getFirmLawyers);
router.get('/search-registered-clients', searchRegisteredClients);

export default router;
