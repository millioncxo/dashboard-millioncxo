import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  actionType: 'SDR_UNASSIGNED' | 'PLAN_DEACTIVATED' | 'PLAN_ACTIVATED' | 'CLIENT_DELETED' | 'CLIENT_UPDATED' | 'OTHER';
  entityType: string; // 'SDR_ASSIGNMENT', 'PLAN', 'CLIENT', etc.
  entityId: mongoose.Types.ObjectId;
  details?: any; // Stores relevant data about the action
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
    },
    actionType: {
      type: String,
      enum: ['SDR_UNASSIGNED', 'PLAN_DEACTIVATED', 'PLAN_ACTIVATED', 'CLIENT_DELETED', 'CLIENT_UPDATED', 'OTHER'],
      required: [true, 'Action type is required'],
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      trim: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    details: {
      type: Schema.Types.Mixed,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ actionType: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;

