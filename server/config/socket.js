import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import MeetingRequest from '../models/MeetingRequest.js';
import logger from './logger.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware to authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.name} (${socket.id})`);

    // Join a specific meeting room for chat
    socket.on('join_room', async ({ meetingId }) => {
      // Validate user is part of this meeting (either client or lawyer)
      try {
        const meeting = await MeetingRequest.findById(meetingId);
        if (!meeting) {
          return socket.emit('error', 'Meeting not found');
        }
        
        if (
          meeting.clientId.toString() !== socket.user._id.toString() &&
          meeting.lawyerId?.toString() !== socket.user._id.toString() &&
          !(socket.user.role === 'admin' && meeting.firmId?.toString() === socket.user.firmId?.toString())
        ) {
          return socket.emit('error', 'Not authorized to join this room');
        }
        
        socket.join(meetingId);
        logger.info(`${socket.user.name} joined room ${meetingId}`);
      } catch (err) {
        socket.emit('error', 'Failed to join room');
      }
    });

    // Handle sending message
    socket.on('send_message', async ({ meetingId, content }) => {
      try {
        const meeting = await MeetingRequest.findById(meetingId);
        if (!meeting || meeting.status !== 'accepted') {
          return socket.emit('error', 'Cannot send message to this meeting');
        }

        // Authorize: Only client, assigned lawyer, or firm admin
        if (
          meeting.clientId.toString() !== socket.user._id.toString() &&
          meeting.lawyerId?.toString() !== socket.user._id.toString() &&
          !(socket.user.role === 'admin' && meeting.firmId?.toString() === socket.user.firmId?.toString())
        ) {
          return socket.emit('error', 'Not authorized to send messages here');
        }

        // Save message to DB
        const message = await Message.create({
          meetingId,
          senderId: socket.user._id,
          content,
        });

        const populatedMessage = await message.populate('senderId', 'name role');

        // Broadcast to everyone in the room
        io.to(meetingId).emit('receive_message', populatedMessage);
      } catch (err) {
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle deleting message
    socket.on('delete_message', async ({ meetingId, messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('error', 'Message not found');
        }

        // Verify sender OR Admin of the firm
        const isSender = message.senderId.toString() === socket.user._id.toString();
        const meeting = await MeetingRequest.findById(meetingId);
        const isAdminOfFirm = socket.user.role === 'admin' && meeting?.firmId?.toString() === socket.user.firmId?.toString();

        if (!isSender && !isAdminOfFirm) {
          return socket.emit('error', 'Not authorized to delete this message');
        }

        await Message.findByIdAndDelete(messageId);

        // Broadcast deletion to the room
        io.to(meetingId).emit('message_deleted', { messageId });
      } catch (err) {
        socket.emit('error', 'Failed to delete message');
      }
    });

    // Handle clearing entire chat
    socket.on('clear_chat', async ({ meetingId }) => {
      try {
        const meeting = await MeetingRequest.findById(meetingId);
        if (!meeting) {
          return socket.emit('error', 'Meeting not found');
        }

        // Authorize: Only client, lawyer, or firm admin
        if (
          meeting.clientId.toString() !== socket.user._id.toString() &&
          meeting.lawyerId?.toString() !== socket.user._id.toString() &&
          !(socket.user.role === 'admin' && meeting.firmId?.toString() === socket.user.firmId?.toString())
        ) {
          return socket.emit('error', 'Not authorized to clear this chat');
        }

        await Message.deleteMany({ meetingId });

        // Broadcast to the room
        io.to(meetingId).emit('chat_cleared');
      } catch (err) {
        socket.emit('error', 'Failed to clear chat');
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
