import mongoose, { Schema, Document, Model } from 'mongoose';

export type LicenseStatus = 'active' | 'paused';

export interface ILicense extends Document {
  clientId: mongoose.Types.ObjectId;
  productOrServiceName: string;
  serviceType: string;
  label: string;
  status: LicenseStatus;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    productOrServiceName: {
      type: String,
      required: [true, 'Product or service name is required'],
      trim: true,
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true,
    },
    label: {
      type: String,
      required: [true, 'License label is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
LicenseSchema.index({ clientId: 1 });
LicenseSchema.index({ status: 1 });
LicenseSchema.index({ serviceType: 1 });
LicenseSchema.index({ createdAt: -1 });
LicenseSchema.index({ startDate: 1 });
LicenseSchema.index({ endDate: 1 });
// Compound indexes
LicenseSchema.index({ clientId: 1, status: 1 });
LicenseSchema.index({ clientId: 1, serviceType: 1 });

const License: Model<ILicense> =
  mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);

export default License;

