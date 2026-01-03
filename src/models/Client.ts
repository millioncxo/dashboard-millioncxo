import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  businessName: string;
  pointOfContactName: string;
  pointOfContactTitle?: string;
  pointOfContactEmail: string;
  additionalEmails?: string[];
  pointOfContactPhone?: string;
  websiteAddress?: string;
  country?: string;
  fullRegisteredAddress: string;
  accountManagerId?: mongoose.Types.ObjectId;
  currentPlanId?: mongoose.Types.ObjectId;
  numberOfLicenses: number;
  numberOfSdrs?: number; // Number of SDRs for "SDR as a Service" plans
  // Plan Management
  planType?: 'REGULAR' | 'POC';
  pricePerLicense?: number;
  currency?: 'USD' | 'INR';
  customPlanName?: string; // Used when plan is "Other"
  // Discount
  discountPercentage?: number; // Optional discount percentage (0-100)
  // Payment Details
  paymentDetails?: {
    amountRequested?: number; // DEPRECATED: Kept for backward compatibility, calculated automatically now
    numberOfMonths: number;
    paymentTerms?: string;
    dealClosedDate?: Date;
    notes?: string;
  };
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL'; // DEPRECATED: Not used for month-wise payments
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields for calculated costs
  totalCostOfService?: number; // Base cost: numberOfLicenses × pricePerLicense
  finalCostAfterDiscount?: number; // Final cost after discount applied
  targetThisMonth?: number;
  achievedThisMonth?: number;
  targetDeadline?: Date; // Custom deadline for target achievement
  // Target Configuration
  positiveResponsesTarget?: number; // Target for positive responses
  meetingsBookedTarget?: number; // Target for meetings booked
}

const ClientSchema = new Schema<IClient>(
  {
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    pointOfContactName: {
      type: String,
      required: [true, 'Point of contact name is required'],
      trim: true,
    },
    pointOfContactTitle: {
      type: String,
      trim: true,
    },
    pointOfContactEmail: {
      type: String,
      required: [true, 'Point of contact email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
    additionalEmails: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every(email => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email));
        },
        message: 'Please provide valid email addresses',
      },
    },
    pointOfContactPhone: {
      type: String,
      trim: true,
    },
    websiteAddress: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    fullRegisteredAddress: {
      type: String,
      required: [true, 'Full registered address is required'],
      trim: true,
    },
    accountManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    currentPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: false,
    },
    numberOfLicenses: {
      type: Number,
      required: [true, 'Number of licenses is required'],
      default: 0,
      min: 0,
    },
    numberOfSdrs: {
      type: Number,
      required: false,
      min: 0,
    },
    planType: {
      type: String,
      enum: ['REGULAR', 'POC'],
      required: false,
    },
    pricePerLicense: {
      type: Number,
      required: false,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'INR'],
      required: false,
    },
    customPlanName: {
      type: String,
      trim: true,
      required: false,
    },
    discountPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      default: 0,
    },
    paymentDetails: {
      amountRequested: {
        type: Number,
        min: 0,
        required: false, // DEPRECATED: Kept for backward compatibility
      },
      numberOfMonths: {
        type: Number,
        min: 1,
      },
      paymentTerms: {
        type: String,
        trim: true,
      },
      dealClosedDate: {
        type: Date,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL'],
      default: 'PENDING',
      required: false, // DEPRECATED: Not used for month-wise payments
    },
    targetThisMonth: {
      type: Number,
      min: 0,
      default: 0,
    },
    achievedThisMonth: {
      type: Number,
      min: 0,
      default: 0,
    },
    targetDeadline: {
      type: Date,
      required: false,
    },
    positiveResponsesTarget: {
      type: Number,
      min: 0,
      default: 0,
      required: false,
    },
    meetingsBookedTarget: {
      type: Number,
      min: 0,
      default: 0,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for calculated base cost (before discount)
ClientSchema.virtual('totalCostOfService').get(function() {
  if (this.pricePerLicense && this.numberOfLicenses) {
    return this.pricePerLicense * this.numberOfLicenses;
  }
  return 0;
});

// Virtual field for calculated final cost (after discount)
ClientSchema.virtual('finalCostAfterDiscount').get(function() {
  const baseCost = this.totalCostOfService || 0;
  const discount = this.discountPercentage || 0;
  if (baseCost > 0 && discount > 0) {
    const discountAmount = (baseCost * discount) / 100;
    return baseCost - discountAmount;
  }
  return baseCost;
});

// Ensure virtual fields are included in JSON output
ClientSchema.set('toJSON', { virtuals: true });
ClientSchema.set('toObject', { virtuals: true });

// Indexes for faster queries
ClientSchema.index({ businessName: 1 });
ClientSchema.index({ accountManagerId: 1 });
ClientSchema.index({ pointOfContactEmail: 1 });
ClientSchema.index({ country: 1 });
ClientSchema.index({ planType: 1 });
ClientSchema.index({ currentPlanId: 1 });
ClientSchema.index({ paymentStatus: 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ updatedAt: -1 });
// Compound indexes for common query patterns
ClientSchema.index({ accountManagerId: 1, paymentStatus: 1 });
ClientSchema.index({ currentPlanId: 1, paymentStatus: 1 });

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);

export default Client;

