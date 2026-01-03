import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISdrClientAssignment extends Document {
  sdrId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  licenses: mongoose.Types.ObjectId[];
  linkedInChatHistory?: string; // Initial LinkedIn conversation history
  chatHistoryAddedAt?: Date; // When chat history was first added
  chatHistoryUpdatedAt?: Date; // When chat history was last updated
  createdAt: Date;
  updatedAt: Date;
}

const SdrClientAssignmentSchema = new Schema<ISdrClientAssignment>(
  {
    sdrId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'SDR ID is required'],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    licenses: {
      type: [Schema.Types.ObjectId],
      ref: 'License',
      default: [],
    },
    linkedInChatHistory: {
      type: String,
      required: false,
      trim: true,
    },
    chatHistoryAddedAt: {
      type: Date,
      required: false,
    },
    chatHistoryUpdatedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index to ensure one SDR per client assignment
SdrClientAssignmentSchema.index({ sdrId: 1, clientId: 1 }, { unique: true });
SdrClientAssignmentSchema.index({ sdrId: 1 });
SdrClientAssignmentSchema.index({ clientId: 1 });

const SdrClientAssignment: Model<ISdrClientAssignment> =
  mongoose.models.SdrClientAssignment ||
  mongoose.model<ISdrClientAssignment>(
    'SdrClientAssignment',
    SdrClientAssignmentSchema
  );

export default SdrClientAssignment;

