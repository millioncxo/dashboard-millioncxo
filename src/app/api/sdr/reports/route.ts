import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import Client from '@/models/Client';
import Report from '@/models/Report';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import License from '@/models/License';
import { requireRole } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { createReportSchema, validateOrThrow } from '@/lib/validation-schemas';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Client;
  void Report;
  void SdrClientAssignment;
  void License;
}

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.write);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Verify SDR role and get user info
    const authUser = await requireRole(['SDR'], req);

    // Connect to database
    await connectToDatabase();

    // Get SDR's user ID from JWT
    const sdrId = authUser.userId;

    // Parse and validate request body
    const body = await req.json();
    const { 
      clientId, 
      licenseId, 
      type, 
      periodStart, 
      periodEnd, 
      summary, 
      metrics,
      inMailsSent,
      inMailsPositiveResponse,
      connectionRequestsSent,
      connectionRequestsPositiveResponse,
    } = body;

    // Validate ObjectId
    const clientIdValidationError = validateObjectIdOrError(clientId, 'client id');
    if (clientIdValidationError) return clientIdValidationError;

    if (licenseId) {
      const licenseIdValidationError = validateObjectIdOrError(licenseId, 'license id');
      if (licenseIdValidationError) return licenseIdValidationError;
    }

    // Check if SDR is assigned to this client
    const assignment = await SdrClientAssignment.findOne({ sdrId, clientId });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this client' },
        { status: 403 }
      );
    }

    // If licenseId is provided, verify it exists and belongs to the client
    if (licenseId) {
      const license = await License.findOne({ _id: licenseId, clientId });
      if (!license) {
        return NextResponse.json(
          { error: 'License not found or does not belong to this client' },
          { status: 404 }
        );
      }
    }

    // Convert date strings to Date objects (Zod validates format, but we need Date objects)
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Create report
    const newReport = await Report.create({
      clientId,
      ...(licenseId && { licenseId }),
      type,
      periodStart: startDate,
      periodEnd: endDate,
      summary,
      metrics: metrics || {},
      ...(inMailsSent !== undefined && { inMailsSent }),
      ...(inMailsPositiveResponse !== undefined && { inMailsPositiveResponse }),
      ...(connectionRequestsSent !== undefined && { connectionRequestsSent }),
      ...(connectionRequestsPositiveResponse !== undefined && { connectionRequestsPositiveResponse }),
      createdBy: sdrId,
    });

    // Populate references for response
    const populatedReport = await Report.findById(newReport._id)
      .populate('licenseId', 'label serviceType')
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Report created successfully',
        report: populatedReport,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('SDR create report error', error);
    return handleApiError(error);
  }
}

// GET endpoint to retrieve SDR's own reports
export async function GET(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.read);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Verify SDR role and get user info
    const authUser = await requireRole(['SDR'], req);

    // Connect to database
    await connectToDatabase();

    // Get SDR's user ID from JWT
    const sdrId = authUser.userId;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build query - only reports created by this SDR
    const query: any = { createdBy: sdrId };

    if (clientId) {
      // Validate ObjectId
      validateObjectIdOrError(clientId, 'client id');

      // Verify SDR is assigned to this client
      const assignment = await SdrClientAssignment.findOne({ sdrId, clientId });
      if (!assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to this client' },
          { status: 403 }
        );
      }
      query.clientId = clientId;
    }

    if (type) {
      query.type = type.toUpperCase();
    }

    if (from || to) {
      query.periodStart = {};
      if (from) {
        query.periodStart.$gte = new Date(from);
      }
      if (to) {
        query.periodStart.$lte = new Date(to);
      }
    }

    // Fetch reports
    const reports = await Report.find(query)
      .populate('clientId', 'businessName')
      .populate('licenseId', 'label serviceType productOrServiceName')
      .sort({ periodStart: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        reports,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get SDR reports error', error);
    return handleApiError(error);
  }
}

