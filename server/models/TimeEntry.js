import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      default: null,
    },
    /** Duration in minutes — auto-calculated when timer is stopped. */
    duration: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    billable: {
      type: Boolean,
      default: true,
    },
    billed: {
      type: Boolean,
      default: false,
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
timeEntrySchema.index({ firmId: 1, caseId: 1 });
timeEntrySchema.index({ firmId: 1, userId: 1 });
timeEntrySchema.index({ caseId: 1, billable: 1 });

export default mongoose.model('TimeEntry', timeEntrySchema);
