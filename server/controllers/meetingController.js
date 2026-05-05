import MeetingRequest from '../models/MeetingRequest.js';
import Message from '../models/Message.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/**
 * @desc    Client sends meeting request
 * @route   POST /api/meetings/request
 * @access  Private (Client only)
 */
export const requestMeeting = asyncHandler(async (req, res) => {
  const { firmId, lawyerId, message, preferredDate } = req.body;

  const meeting = await MeetingRequest.create({
    clientId: req.user._id,
    firmId,
    lawyerId,
    message,
    preferredDate,
  });

  ApiResponse.created(res, {
    message: 'Meeting request sent successfully',
    data: meeting,
  });
});

/**
 * @desc    Client views their meeting requests
 * @route   GET /api/meetings/client
 * @access  Private (Client only)
 */
export const getClientMeetings = asyncHandler(async (req, res) => {
  const meetings = await MeetingRequest.find({ clientId: req.user._id })
    .populate('firmId', 'name')
    .populate('lawyerId', 'name')
    .sort('-createdAt');

  // Add unread message count for each meeting
  const meetingsWithUnread = await Promise.all(
    meetings.map(async (m) => {
      const unreadCount = await Message.countDocuments({
        meetingId: m._id,
        senderId: { $ne: req.user._id },
        read: false,
      });
      return { ...m.toObject(), unreadCount };
    })
  );

  ApiResponse.success(res, {
    message: 'Client meetings retrieved',
    data: meetingsWithUnread,
  });
});

/**
 * @desc    Firm admin views incoming requests
 * @route   GET /api/meetings/firm
 * @access  Private (Firm Admin)
 */
export const getFirmMeetings = asyncHandler(async (req, res) => {
  const meetings = await MeetingRequest.find({ firmId: req.user.firmId })
    .populate('clientId', 'name email')
    .populate('lawyerId', 'name')
    .sort('-createdAt');

  // Add unread message count for each meeting
  const meetingsWithUnread = await Promise.all(
    meetings.map(async (m) => {
      const unreadCount = await Message.countDocuments({
        meetingId: m._id,
        senderId: { $ne: req.user._id },
        read: false,
      });
      return { ...m.toObject(), unreadCount };
    })
  );

  ApiResponse.success(res, {
    message: 'Firm meeting requests retrieved',
    data: meetingsWithUnread,
  });
});

/**
 * @desc    Firm admin accepts/rejects request
 * @route   PATCH /api/meetings/:id/status
 * @access  Private (Firm Admin)
 */
export const updateMeetingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status update');
  }

  const meeting = await MeetingRequest.findOneAndUpdate(
    { _id: req.params.id, firmId: req.user.firmId },
    { status },
    { new: true }
  );

  if (!meeting) {
    throw new ApiError(404, 'Meeting request not found');
  }

  ApiResponse.success(res, {
    message: `Meeting request ${status}`,
    data: meeting,
  });
});

/**
 * @desc    Lawyer views incoming requests directed to them
 * @route   GET /api/meetings/lawyer
 * @access  Private (Lawyer)
 */
export const getLawyerMeetings = asyncHandler(async (req, res) => {
  const meetings = await MeetingRequest.find({ lawyerId: req.user._id })
    .populate('clientId', 'name email')
    .populate('firmId', 'name')
    .sort('-createdAt');

  // Add unread message count for each meeting
  const meetingsWithUnread = await Promise.all(
    meetings.map(async (m) => {
      const unreadCount = await Message.countDocuments({
        meetingId: m._id,
        senderId: { $ne: req.user._id },
        read: false,
      });
      return { ...m.toObject(), unreadCount };
    })
  );

  ApiResponse.success(res, {
    message: 'Lawyer meeting requests retrieved',
    data: meetingsWithUnread,
  });
});

/**
 * @desc    Lawyer accepts/rejects request
 * @route   PATCH /api/meetings/lawyer/:id/status
 * @access  Private (Lawyer)
 */
export const updateLawyerMeetingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status update');
  }

  const meeting = await MeetingRequest.findOneAndUpdate(
    { _id: req.params.id, lawyerId: req.user._id },
    { status },
    { new: true }
  ).populate('clientId', 'name email');

  if (!meeting) {
    throw new ApiError(404, 'Meeting request not found or unauthorized');
  }

  ApiResponse.success(res, {
    message: `Meeting request ${status}`,
    data: meeting,
  });
});

/**
 * @desc    Get messages for a specific meeting
 * @route   GET /api/meetings/:id/messages
 * @access  Private (Client, Lawyer)
 */
export const getMeetingMessages = asyncHandler(async (req, res) => {
  const meeting = await MeetingRequest.findById(req.params.id);

  if (!meeting) {
    throw new ApiError(404, 'Meeting not found');
  }

  // Authorize: Only the client or assigned lawyer can view chat
  if (
    meeting.clientId.toString() !== req.user._id.toString() &&
    meeting.lawyerId?.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    throw new ApiError(403, 'Unauthorized to view these messages');
  }

  // MARK AS READ: Mark all messages sent by others as read
  await Message.updateMany(
    { meetingId: req.params.id, senderId: { $ne: req.user._id }, read: false },
    { read: true }
  );

  const messages = await Message.find({ meetingId: req.params.id })
    .populate('senderId', 'name role')
    .sort('createdAt');

  ApiResponse.success(res, {
    message: 'Messages retrieved',
    data: messages,
  });
});

/**
 * @desc    Delete meeting and all messages (Sever connection)
 * @route   DELETE /api/meetings/:id
 * @access  Private (Client, Lawyer, Admin)
 */
export const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await MeetingRequest.findById(req.params.id);

  if (!meeting) {
    throw new ApiError(404, 'Meeting not found');
  }

  // Authorize: Only client or lawyer/firm can delete
  if (
    meeting.clientId.toString() !== req.user._id.toString() &&
    meeting.lawyerId?.toString() !== req.user._id.toString() &&
    req.user.role !== ROLES.ADMIN
  ) {
    throw new ApiError(403, 'Unauthorized to delete this meeting');
  }

  // 1. Delete all messages
  await Message.deleteMany({ meetingId: req.params.id });

  // 2. Delete the meeting request
  await MeetingRequest.findByIdAndDelete(req.params.id);

  ApiResponse.success(res, {
    message: 'Chat session deleted and connection reset',
  });
});

/**
 * @desc    Initiate or get existing chat between firm and client
 * @route   POST /api/meetings/initiate
 * @access  Private (Admin/Lawyer)
 */
export const initiateChat = asyncHandler(async (req, res) => {
  const { clientId } = req.body;
  if (!clientId) throw new ApiError(400, 'clientId is required');

  const firmId = req.user.firmId;
  const lawyerId = req.user.role === ROLES.LAWYER ? req.user._id : null;

  // Try to find existing accepted meeting
  let meeting = await MeetingRequest.findOne({
    clientId,
    firmId,
    lawyerId,
    status: 'accepted'
  });

  if (!meeting) {
    // Check if there's a pending one to accept
    meeting = await MeetingRequest.findOne({
      clientId,
      firmId,
      lawyerId,
      status: 'pending'
    });

    if (meeting) {
      meeting.status = 'accepted';
      await meeting.save();
    } else {
      // Create a fresh accepted connection
      meeting = await MeetingRequest.create({
        clientId,
        firmId,
        lawyerId,
        status: 'accepted',
        preferredDate: new Date(),
        message: `Direct chat initiated by ${req.user.name}`
      });
    }
  }

  ApiResponse.success(res, {
    message: 'Chat initiated',
    data: meeting
  });
});
