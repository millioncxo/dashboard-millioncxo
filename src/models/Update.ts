import mongoose, { Schema, Document, Model } from 'mongoose';

export type UpdateType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'REPORT' | 'OTHER';

export interface IUpdate extends Document {
  clientId: mongoose.Types.ObjectId;
  sdrId: mongoose.Types.ObjectId;
  type: UpdateType;
  title: string;
  description: string;
  date: Date;
  attachments?: string[]; // URLs or file paths
  chatHistory?: string; // Additional LinkedIn chat history (for ongoing conversations)
  readByClient?: boolean; // Whether the client has read this update
  readAt?: Date; // When the client read this update
  visibleToClient?: boolean; // Whether the client can see this update
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: Date;
  updatedAt: Date;
}

const UpdateSchema = new Schema<IUpdate>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    sdrId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'SDR ID is required'],
    },
    type: {
      type: String,
      enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'REPORT', 'OTHER'],
      required: [true, 'Update type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    attachments: {
      type: [String],
      default: [],
    },
    chatHistory: {
      type: String,
      required: false,
      trim: true,
    },
    readByClient: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      required: false,
    },
    visibleToClient: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
UpdateSchema.index({ clientId: 1 });
UpdateSchema.index({ sdrId: 1 });
UpdateSchema.index({ date: -1 });
UpdateSchema.index({ type: 1 });
UpdateSchema.index({ clientId: 1, readByClient: 1 }); // For efficient unread queries
UpdateSchema.index({ clientId: 1, visibleToClient: 1 });
UpdateSchema.index({ priority: 1 });

const Update: Model<IUpdate> =
  mongoose.models.Update || mongoose.model<IUpdate>('Update', UpdateSchema);

export default Update;

