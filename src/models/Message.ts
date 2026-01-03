import mongoose, { Schema, Document, Model } from 'mongoose';

export type SenderRole = 'CLIENT' | 'SDR';

export interface IMessage extends Document {
  clientId: mongoose.Types.ObjectId;
  sdrId: mongoose.Types.ObjectId;
  senderRole: SenderRole;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
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
    senderRole: {
      type: String,
      enum: ['CLIENT', 'SDR'],
      required: [true, 'Sender role is required'],
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
MessageSchema.index({ clientId: 1, sdrId: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ read: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;

