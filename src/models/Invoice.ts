import mongoose, { Schema, Document, Model } from 'mongoose';

export type InvoiceStatus = 'GENERATED' | 'PAID' | 'OVERDUE';

export interface IInvoice extends Document {
  clientId: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  typeOfService: string;
  numberOfServices: number;
  amount: number;
  currency: string;
  dueDate: Date;
  status: InvoiceStatus;
  invoiceDate?: Date; // Explicit invoice date (defaults to createdAt if not set)
  invoiceMonth?: number; // Month (1-12) for monthly invoice tracking
  invoiceYear?: number; // Year for monthly invoice tracking
  paidAt?: Date; // Payment date (when status is PAID)
  fileId?: string; // GridFS file ID for uploaded PDF
  description?: string;
  notes?: string; // Additional notes for the invoice
  paymentTerms?: string; // Custom payment terms
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    typeOfService: {
      type: String,
      required: [true, 'Type of service is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    numberOfServices: {
      type: Number,
      required: [true, 'Number of services is required'],
      min: 1,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      uppercase: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['GENERATED', 'PAID', 'OVERDUE'],
      default: 'GENERATED',
    },
    invoiceDate: {
      type: Date,
      required: false,
      default: Date.now, // ensure invoiceDate is always set for downstream queries/aggregations
    },
    invoiceMonth: {
      type: Number,
      required: false,
      min: 1,
      max: 12,
    },
    invoiceYear: {
      type: Number,
      required: false,
    },
    paidAt: {
      type: Date,
      required: false,
    },
    fileId: {
      type: String,
      required: false,
      trim: true,
    },
    notes: {
      type: String,
      required: false,
      trim: true,
    },
    paymentTerms: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'invoices', // explicit collection name to avoid pluralization/hot-reload issues
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        const { _id, ...rest } = ret as any;
        return rest;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        const { _id, ...rest } = ret as any;
        return rest;
      },
    },
  }
);

// Indexes for faster queries
InvoiceSchema.index({ clientId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ paidAt: 1 });
InvoiceSchema.index({ invoiceDate: 1 });
InvoiceSchema.index({ invoiceMonth: 1, invoiceYear: 1 });
InvoiceSchema.index({ clientId: 1, invoiceMonth: 1, invoiceYear: 1 }, { unique: true }); // Ensure one invoice per client per month
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ fileId: 1 }); // For queries filtering by fileId
// Compound indexes for common query patterns
InvoiceSchema.index({ clientId: 1, status: 1 });
InvoiceSchema.index({ status: 1, dueDate: 1 }); // For finding overdue invoices
InvoiceSchema.index({ clientId: 1, paidAt: 1 }); // For payment history queries
InvoiceSchema.index({ createdAt: 1 }); // For calendar queries using createdAt as invoice date

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;

