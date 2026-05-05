import mongoose from 'mongoose';
import { ALL_DEADLINE_TYPES, ALL_DEADLINE_STATUSES, DEADLINE_STATUS } from '../config/constants.js';

const deadlineSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Deadline title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    type: {
      type: String,
      enum: ALL_DEADLINE_TYPES,
      required: [true, 'Deadline type is required'],
    },
    status: {
      type: String,
      enum: ALL_DEADLINE_STATUSES,
      default: DEADLINE_STATUS.UPCOMING,
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────
deadlineSchema.index({ firmId: 1, caseId: 1 });
deadlineSchema.index({ firmId: 1, dueDate: 1 });
deadlineSchema.index({ firmId: 1, status: 1 });

export default mongoose.model('Deadline', deadlineSchema);
