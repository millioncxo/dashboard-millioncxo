import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PlanConfiguration {
  requiresSdrCount?: boolean; // For SDR as a Service - shows number input
  requiresLicenseCount?: boolean; // For license-based plans
  fixedPrice?: boolean; // If true, price is fixed from plan, not editable
  pricePerSdr?: number; // For SDR as a Service (e.g., 2000)
  pricePerLicense?: number; // For license-based plans (e.g., 250)
}

export interface IPlan extends Document {
  name: string;
  description?: string;
  pricePerMonth?: number;
  features?: string[];
  planConfiguration?: PlanConfiguration; // Plan-specific configuration options
  isActive?: boolean; // Whether the plan is active (can be assigned to new clients)
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    pricePerMonth: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    features: {
      type: [String],
      min: 0,
      default: [],
    },
    planConfiguration: {
      type: {
        requiresSdrCount: { type: Boolean, default: false },
        requiresLicenseCount: { type: Boolean, default: false },
        fixedPrice: { type: Boolean, default: false },
        pricePerSdr: { type: Number, min: 0 },
        pricePerLicense: { type: Number, min: 0 },
      },
      required: false,
      _id: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PlanSchema.index({ name: 1 });

const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;

