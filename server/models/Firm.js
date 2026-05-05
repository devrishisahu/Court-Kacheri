import mongoose from 'mongoose';

const firmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Firm name is required'],
      trim: true,
      maxlength: [100, 'Firm name cannot exceed 100 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Firm', firmSchema);
