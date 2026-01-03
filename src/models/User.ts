import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'ADMIN' | 'SDR' | 'CLIENT';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  passwordEncrypted?: string; // Encrypted password for admin viewing (reversible)
  role: UserRole;
  clientId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
      index: true, // This creates the index, no need for separate index() call
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    passwordEncrypted: {
      type: String,
      required: false, // Optional - for backward compatibility
    },
    role: {
      type: String,
      enum: ['ADMIN', 'SDR', 'CLIENT'],
      required: [true, 'Role is required'],
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (email index is already created by unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ clientId: 1 });

// Prevent password hash and encrypted password from being returned in queries by default
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    const { passwordHash, passwordEncrypted, ...rest } = ret;
    return rest;
  },
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

