import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import Client from '@/models/Client';
import Plan from '@/models/Plan';
import User from '@/models/User';
import License from '@/models/License';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Update from '@/models/Update';
import { requireRole } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Client;
  void Plan;
  void User;
  void License;
  void SdrClientAssignment;
  void Update;
}

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

    // Fetch all client assignments for this SDR
    const assignments = await SdrClientAssignment.find({ sdrId })
      .populate({
        path: 'clientId',
        select: 'businessName businessAddress pointOfContactName pointOfContactTitle pointOfContactEmail pointOfContactPhone websiteAddress country fullRegisteredAddress numberOfLicenses currentPlanId accountManagerId targetThisMonth achievedThisMonth positiveResponsesTarget meetingsBookedTarget targetDeadline',
        populate: [
          {
            path: 'currentPlanId',
            select: 'name pricePerMonth creditsPerMonth description',
          },
          {
            path: 'accountManagerId',
            select: 'name email',
          },
        ],
      })
      .populate({
        path: 'licenses',
        select: 'productOrServiceName serviceType label status startDate endDate',
      })
      .lean();

    // Get latest update date for each client
    const clientIds = assignments.map((a: any) => a.clientId._id);
    const latestUpdates = await Update.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $sort: { date: -1, createdAt: -1 } },
      { $group: { _id: '$clientId', latestUpdate: { $first: '$$ROOT' } } },
    ]);

    const updatesMap = new Map(
      latestUpdates.map((u: any) => [u._id.toString(), u.latestUpdate.date])
    );

    // Calculate total active licenses (all active licenses for assigned clients)
    // This will be calculated after fetching all licenses

    // Fetch all licenses for all assigned clients
    const allClientIds = assignments.map((a: any) => a.clientId._id);
    const allClientLicenses = await License.find({ clientId: { $in: allClientIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Group licenses by clientId
    const licensesByClient = new Map<string, any[]>();
    allClientLicenses.forEach((license: any) => {
      const clientIdStr = license.clientId.toString();
      if (!licensesByClient.has(clientIdStr)) {
        licensesByClient.set(clientIdStr, []);
      }
      licensesByClient.get(clientIdStr)!.push(license);
    });

    // Format response
    const clients = assignments.map((assignment) => {
      const client = assignment.clientId as any; // Populated client object
      const clientIdStr = client._id.toString();
      const allLicensesForClient = licensesByClient.get(clientIdStr) || [];
      const assignedLicenseIds = (assignment.licenses || []).map((id: any) => id.toString());
      
      // Mark which licenses are assigned to this SDR
      const licensesWithAssignment = allLicensesForClient.map((license: any) => ({
        ...license,
        isAssignedToSdr: assignedLicenseIds.includes(license._id.toString()),
      }));

      return {
        clientId: client._id,
        businessName: client.businessName,
        businessAddress: client.businessAddress,
        fullRegisteredAddress: client.fullRegisteredAddress,
        pointOfContact: {
          name: client.pointOfContactName,
          title: client.pointOfContactTitle,
          email: client.pointOfContactEmail,
          phone: client.pointOfContactPhone,
        },
        websiteAddress: client.websiteAddress,
        country: client.country,
        plan: client.currentPlanId,
        accountManager: client.accountManagerId,
        numberOfLicenses: client.numberOfLicenses || 0,
        licenses: licensesWithAssignment, // All licenses for the client, with assignment flag
        assignmentId: assignment._id,
        assignedAt: assignment.createdAt,
        lastUpdateDate: updatesMap.get(client._id.toString()) || null,
      };
    });

    // Calculate total licenses (all licenses for all assigned clients, not just assigned ones)
    const totalLicenses = allClientLicenses.length;
    
    // Calculate active licenses (all active licenses for assigned clients)
    const totalActiveLicenses = allClientLicenses.filter((l: any) => l.status === 'active').length;

    return NextResponse.json(
      {
        success: true,
        clients,
        stats: {
          totalLicenses,
          activeLicenses: totalActiveLicenses,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('SDR clients error', error);
    return handleApiError(error);
  }
}

