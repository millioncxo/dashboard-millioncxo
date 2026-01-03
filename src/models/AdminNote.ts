import mongoose, { Schema, Document, Model } from 'mongoose';

export type AdminNoteTag = 'ACCOUNT' | 'BILLING' | 'RISK';

export interface IAdminNote extends Document {
  clientId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  tag: AdminNoteTag;
  pinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminNoteSchema = new Schema<IAdminNote>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      enum: ['ACCOUNT', 'BILLING', 'RISK'],
      required: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

AdminNoteSchema.index({ clientId: 1, createdAt: -1 });
AdminNoteSchema.index({ clientId: 1, pinned: 1 });

const AdminNote: Model<IAdminNote> =
  mongoose.models.AdminNote || mongoose.model<IAdminNote>('AdminNote', AdminNoteSchema);

export default AdminNote;

