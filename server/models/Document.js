import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Case reference is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL / path is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
documentSchema.index({ firmId: 1, caseId: 1 });
documentSchema.index({ uploadedBy: 1 });

export default mongoose.model('Document', documentSchema);
