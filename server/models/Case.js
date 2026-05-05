import mongoose from 'mongoose';
import Counter from './Counter.js';
import { ALL_CASE_STATUSES, CASE_STATUS } from '../config/constants.js';

const caseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      trim: true,
      // Auto-generated before save — unique per firm
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    assignedLawyers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ALL_CASE_STATUSES,
      default: CASE_STATUS.OPEN,
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
caseSchema.index({ firmId: 1, status: 1 });
caseSchema.index({ firmId: 1, clientId: 1 });
caseSchema.index({ firmId: 1, caseNumber: 1 }, { unique: true, sparse: true });
caseSchema.index({ title: 'text' });

// ─── Auto-generate caseNumber ───────────────────────────────────────
caseSchema.pre('save', async function (next) {
  if (this.isNew && !this.caseNumber) {
    const counter = await mongoose.model('Counter').findByIdAndUpdate(
      `case-${this.firmId}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const year = new Date().getFullYear();
    this.caseNumber = `CK-${year}-${String(counter.seq).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Case', caseSchema);
