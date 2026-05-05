import mongoose from 'mongoose';
import Counter from './Counter.js';
import { ALL_BILLING_STATUSES, BILLING_STATUS } from '../config/constants.js';

const billingItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      trim: true,
      // Auto-generated before save
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required'],
    },
    items: {
      type: [billingItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ALL_BILLING_STATUSES,
      default: BILLING_STATUS.DRAFT,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
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
billingSchema.index({ firmId: 1, caseId: 1 });
billingSchema.index({ firmId: 1, clientId: 1 });
billingSchema.index({ firmId: 1, status: 1 });
billingSchema.index({ firmId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });

// ─── Auto-generate invoiceNumber ────────────────────────────────────
billingSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const counter = await mongoose.model('Counter').findByIdAndUpdate(
      `billing-${this.firmId}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV-${year}-${String(counter.seq).padStart(4, '0')}`;
  }

  // Auto-calculate totalAmount from items
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);
  }

  next();
});

export default mongoose.model('Billing', billingSchema);
