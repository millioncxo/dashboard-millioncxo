import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'USER_CREATED'
  | 'SDR_UPDATE'
  | 'ADMIN_NOTE'
  | 'LOGIN_SUCCESS';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId; // optional: target user
  role?: 'ADMIN' | 'SDR' | 'CLIENT'; // optional: role target
  type: NotificationType;
  message: string;
  link?: string;
  emailSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'SDR', 'CLIENT'],
      required: false,
    },
    type: {
      type: String,
      enum: ['USER_CREATED', 'SDR_UPDATE', 'ADMIN_NOTE', 'LOGIN_SUCCESS'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: false,
      trim: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ role: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

