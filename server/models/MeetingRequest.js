import mongoose from 'mongoose';

const meetingRequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
    },
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const MeetingRequest = mongoose.model('MeetingRequest', meetingRequestSchema);

export default MeetingRequest;
