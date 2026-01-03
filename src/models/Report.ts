import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

export interface IReport extends Document {
  clientId: mongoose.Types.ObjectId;
  licenseId?: mongoose.Types.ObjectId;
  type: ReportType;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  metrics: Record<string, any>;
  // LinkedIn-specific metrics
  inMailsSent?: number;
  inMailsPositiveResponse?: number;
  connectionRequestsSent?: number;
  connectionRequestsPositiveResponse?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    licenseId: {
      type: Schema.Types.ObjectId,
      ref: 'License',
      required: false,
    },
    type: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'],
      required: [true, 'Report type is required'],
    },
    periodStart: {
      type: Date,
      required: [true, 'Period start date is required'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Period end date is required'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // LinkedIn-specific metrics
    inMailsSent: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    inMailsPositiveResponse: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    connectionRequestsSent: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    connectionRequestsPositiveResponse: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
ReportSchema.index({ clientId: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ periodStart: 1, periodEnd: 1 });
ReportSchema.index({ createdBy: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ licenseId: 1 });
// Compound indexes
ReportSchema.index({ clientId: 1, type: 1 });
ReportSchema.index({ clientId: 1, createdAt: -1 });
ReportSchema.index({ createdBy: 1, type: 1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;

