import { z } from 'zod';

/**
 * Common validation schemas
 */

// Email validation
export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

// ObjectId validation
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Client validation schemas
 */
export const createClientSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200, 'Business name too long'),
  pointOfContactName: z.string().min(1, 'Contact name is required').max(100),
  pointOfContactTitle: z.string().max(100).optional(),
  pointOfContactEmail: emailSchema,
  additionalEmails: z.array(emailSchema).optional().default([]),
  pointOfContactPhone: z.string().max(20).optional(),
  websiteAddress: z.string().url('Invalid URL').optional().or(z.literal('')),
  country: z.string().max(100).optional(),
  fullRegisteredAddress: z.string().min(1, 'Full registered address is required').max(500),
  accountManagerId: objectIdSchema.optional(),
  currentPlanId: objectIdSchema.optional(),
  customPlanName: z.string().max(200).optional(),
  planType: z.enum(['REGULAR', 'POC']).optional(),
  pricePerLicense: z.number().min(0).optional(),
  currency: z.enum(['USD', 'INR']).optional().default('USD'),
  numberOfLicenses: z.number().int().min(0).default(0),
  numberOfSdrs: z.number().int().min(0).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  paymentStatus: z.string().optional(),
  paymentDetails: z.object({
    amountRequested: z.number().min(0).optional(),
    numberOfMonths: z.number().int().min(1).default(1),
    paymentTerms: z.string().optional(),
    dealClosedDate: z.string()
      .refine((val) => {
        if (!val) return true; // Optional, so empty is valid
        // Accept both ISO datetime (2024-01-15T00:00:00Z) and date format (2024-01-15)
        const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return isoDateTimeRegex.test(val) || dateRegex.test(val);
      }, {
        message: 'Invalid date format. Use YYYY-MM-DD or ISO datetime format',
      })
      .optional(),
    notes: z.string().optional(),
  }).optional(),
  positiveResponsesTarget: z.number().int().min(0).optional(),
  meetingsBookedTarget: z.number().int().min(0).optional(),
  licenses: z.array(z.object({
    productOrServiceName: z.string().min(1),
    serviceType: z.string().min(1),
    label: z.string().min(1),
  })).optional().default([]),
}).strict();

export const updateClientSchema = createClientSchema.partial().extend({
  targetThisMonth: z.number().int().min(0).optional(),
  achievedThisMonth: z.number().int().min(0).optional(),
  targetDeadline: z.string().datetime().optional().or(z.literal('')),
});

/**
 * User validation schemas
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'SDR', 'CLIENT']),
  clientId: objectIdSchema.optional(),
  isActive: z.boolean().default(true),
}).strict();

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
}).strict();

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
}).strict();

/**
 * Invoice generation schema
 */
export const generateInvoiceSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
}).strict();

/**
 * Report validation schema
 */
export const createReportSchema = z.object({
  clientId: objectIdSchema,
  licenseId: objectIdSchema.optional(),
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  summary: z.string().min(1, 'Summary is required'),
  metrics: z.record(z.any()).optional(),
  inMailsSent: z.number().int().min(0).optional(),
  inMailsPositiveResponse: z.number().int().min(0).optional(),
  connectionRequestsSent: z.number().int().min(0).optional(),
  connectionRequestsPositiveResponse: z.number().int().min(0).optional(),
}).strict().refine(
  (data) => new Date(data.periodStart) < new Date(data.periodEnd),
  {
    message: 'periodStart must be before periodEnd',
    path: ['periodEnd'],
  }
);

/**
 * Update validation schema
 */
export const createUpdateSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'REPORT', 'OTHER']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  attachments: z.array(z.string()).optional().default([]),
  chatHistory: z.string().min(1, 'LinkedIn chat snippet is required'),
  visibleToClient: z.boolean().default(false),
  priority: z.string().optional(),
}).strict();

/**
 * Chat history update schema
 */
export const updateChatHistorySchema = z.object({
  chatHistory: z.string().nullable().optional(),
}).strict();

/**
 * Message validation schema
 */
export const createMessageSchema = z.object({
  text: z.string().min(1, 'Message text is required').max(5000, 'Message text cannot exceed 5000 characters'),
  clientId: objectIdSchema.optional(), // Required for SDR, optional for CLIENT (uses auth token)
  sdrId: objectIdSchema.optional(), // Not used, derived from assignment
}).strict();

/**
 * Validation helper function
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

