import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import Client from '@/models/Client';
import Plan from '@/models/Plan';
import User from '@/models/User';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import License from '@/models/License';
import { requireRole } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Client;
  void Plan;
  void User;
  void SdrClientAssignment;
  void License;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.read);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Validate ObjectId
    validateObjectIdOrError(params.clientId, 'client id');

    // Verify SDR role and get user info
    const authUser = await requireRole(['SDR'], req);

    // Connect to database
    await connectToDatabase();

    // Get SDR's user ID from JWT
    const sdrId = authUser.userId;

    // Check if SDR is assigned to this client
    const assignment = await SdrClientAssignment.findOne({
      sdrId,
      clientId: params.clientId,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this client' },
        { status: 403 }
      );
    }

    // Fetch full client details
    const client = await Client.findById(params.clientId)
      .populate('accountManagerId', 'name email')
      .populate('currentPlanId', 'name pricePerMonth creditsPerMonth description')
      .lean();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch all licenses for this client
    const licenses = await License.find({ clientId: params.clientId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch licenses assigned to this SDR for this client
    const assignedLicenses = assignment.licenses || [];

    // Format client data to match frontend expectations
    const formattedClient = {
      ...client,
      pointOfContact: {
        name: (client as any).pointOfContactName,
        title: (client as any).pointOfContactTitle,
        email: (client as any).pointOfContactEmail,
        phone: (client as any).pointOfContactPhone,
      },
      licenses: licenses.map((license) => ({
        ...license,
        isAssignedToSdr: assignedLicenses.some(
          (id: any) => id.toString() === license._id.toString()
        ),
      })),
      assignmentId: assignment._id,
      assignedAt: assignment.createdAt,
    };

    // Remove the old flat fields
    delete (formattedClient as any).pointOfContactName;
    delete (formattedClient as any).pointOfContactTitle;
    delete (formattedClient as any).pointOfContactEmail;
    delete (formattedClient as any).pointOfContactPhone;

    return NextResponse.json(
      {
        success: true,
        client: formattedClient,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get client details error', error, { clientId: params.clientId });
    return handleApiError(error);
  }
}

