import { Router } from 'express';
import { authMiddleware, checkRole } from '../middleware/auth.js';
import {
  requestMeeting,
  getClientMeetings,
  getFirmMeetings,
  updateMeetingStatus,
  getLawyerMeetings,
  updateLawyerMeetingStatus,
  getMeetingMessages,
  deleteMeeting,
  initiateChat,
} from '../controllers/meetingController.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authMiddleware);

// Client specific
router.post('/request', checkRole(ROLES.CLIENT), requestMeeting);
router.get('/client', checkRole(ROLES.CLIENT), getClientMeetings);

// Firm admin specific
router.get('/firm', checkRole(ROLES.ADMIN), getFirmMeetings);
router.patch('/:id/status', checkRole(ROLES.ADMIN), updateMeetingStatus);

// Lawyer specific
router.get('/lawyer', checkRole(ROLES.LAWYER), getLawyerMeetings);
router.patch('/lawyer/:id/status', checkRole(ROLES.LAWYER), updateLawyerMeetingStatus);

// Shared (Client/Lawyer/Admin)
router.post('/initiate', checkRole(ROLES.ADMIN, ROLES.LAWYER), initiateChat);
router.get('/:id/messages', getMeetingMessages);
router.delete('/:id', deleteMeeting);

export default router;
