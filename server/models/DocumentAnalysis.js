import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  importance: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
  },
  category: {
    type: String,
    enum: [
      'charge',
      'obligation',
      'deadline',
      'penalty',
      'right',
      'definition',
      'party',
      'jurisdiction',
      'evidence',
      'other',
    ],
    default: 'other',
  },
}, { _id: false });

const documentAnalysisSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      unique: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
    },
    executiveSummary: {
      type: String,
      maxlength: 5000,
    },
    documentType: {
      type: String,
      // FIR / Bail Application / Charge Sheet / Contract / Judgment / Notice / Petition etc.
    },
    clauses: {
      type: [clauseSchema],
      default: [],
    },
    parties: [{
      name: String,
      role: String, // Petitioner / Respondent / Accused / Complainant / Witness
    }],
    keyDates: [{
      label: String,
      date: String,
      context: String,
    }],
    legalReferences: [{
      section: String,   // e.g. "Section 420 IPC"
      description: String,
      relevance: String,
    }],
    actionItems: [{
      action: String,
      urgency: {
        type: String,
        enum: ['immediate', 'soon', 'normal'],
        default: 'normal',
      },
    }],
    riskLevel: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    riskRationale: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: String,
    processingTimeMs: Number,
    tokensUsed: Number,
    analyzedAt: Date,
  },
  { timestamps: true }
);

documentAnalysisSchema.index({ documentId: 1 }, { unique: true });
documentAnalysisSchema.index({ caseId: 1, firmId: 1 });
documentAnalysisSchema.index({ firmId: 1, status: 1 });

export default mongoose.model('DocumentAnalysis', documentAnalysisSchema);
