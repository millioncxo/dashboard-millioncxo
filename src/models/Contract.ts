import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContract extends Document {
  clientId: mongoose.Types.ObjectId;
  fileUrl?: string; // Legacy field, kept for backward compatibility
  fileId?: string; // GridFS file ID (primary method)
  signedDate?: Date;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    fileUrl: {
      type: String,
      required: false,
      trim: true,
    },
    fileId: {
      type: String,
      required: false,
      trim: true,
    },
    signedDate: {
      type: Date,
      required: false,
    },
    version: {
      type: String,
      required: [true, 'Contract version is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ContractSchema.index({ clientId: 1 });
ContractSchema.index({ version: 1 });

const Contract: Model<IContract> =
  mongoose.models.Contract ||
  mongoose.model<IContract>('Contract', ContractSchema);

export default Contract;

