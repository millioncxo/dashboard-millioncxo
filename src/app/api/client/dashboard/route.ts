import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import Client from '@/models/Client';
import License from '@/models/License';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import User from '@/models/User';
import Plan from '@/models/Plan';
import { requireRole } from '@/lib/auth';

// Ensure models are registered (this helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  // Server-side only - ensure models are loaded
  void Client;
  void User;
  void Plan;
  void License;
  void SdrClientAssignment;
}

export async function GET(req: NextRequest) {
  try {
    // Verify client role and get user info
    const authUser = await requireRole(['CLIENT'], req);

    // Connect to database
    await connectToDatabase();

    // Get client ID from JWT (not from request body to prevent abuse)
    const clientId = authUser.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found in authentication token' },
        { status: 400 }
      );
    }

    // Fetch client information - ensure all fields are included
    const client = await Client.findById(clientId)
      .populate('accountManagerId', 'name email')
      .populate('currentPlanId')
      .lean();

    // Ensure critical fields are present
    if (client) {
      (client as any).numberOfLicenses = (client as any).numberOfLicenses ?? 0;
      (client as any).paymentStatus = (client as any).paymentStatus ?? 'PENDING';
    }

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch licenses (services)
    const licenses = await License.find({ clientId }).lean();

    // Get SDR assignment
    const assignment = await SdrClientAssignment.findOne({ clientId })
      .populate('sdrId', 'name email')
      .lean();

    const target = client.targetThisMonth ?? client.numberOfLicenses ?? 0;
    const achieved = client.achievedThisMonth ?? 0;
    const progressPercent = target > 0 ? Math.round((achieved / target) * 100) : 0;

    const targetsAndDeliverables = {
      progressPercent,
      status: progressPercent >= 100 ? 'ACHIEVED' : progressPercent >= 75 ? 'ON_TRACK' : 'IN_PROGRESS',
      targetType: 'Monthly Progress',
      lastUpdated: new Date(),
    };

    // Current month status
    // Use numberOfLicenses from client, or count of licenses if numberOfLicenses is 0
    const totalLicenses = client.numberOfLicenses > 0 ? client.numberOfLicenses : licenses.length;
    const currentMonthStatus = {
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      services: licenses.length,
      activeServices: licenses.filter((l) => l.status === 'active').length,
      licensesRemaining: totalLicenses,
    };

    // Account manager info
    const accountManager = assignment?.sdrId || client.accountManagerId || null;

    // Format plan data with new plan management fields
    const clientData = client as any;
    let planData = null;
    
    // Determine plan name - use customPlanName if set, otherwise fetch from Plan model
    let planName = clientData.customPlanName || null;
    if (client.currentPlanId && !planName) {
      const plan = client.currentPlanId as any;
      planName = plan.name || null;
    }

    // Build plan data with all fields
    if (planName || clientData.planType || clientData.pricePerLicense || client.currentPlanId) {
      const plan = client.currentPlanId as any;
      planData = {
        name: planName || plan?.name || 'No Plan Assigned',
        licensesPerMonth: totalLicenses,
        numberOfLicenses: totalLicenses,
        planType: clientData.planType || null,
        pricePerLicense: clientData.pricePerLicense || null,
        currency: clientData.currency || 'USD',
        totalCostOfService: clientData.pricePerLicense && totalLicenses 
          ? clientData.pricePerLicense * totalLicenses 
          : (plan?.creditsPerMonth || 0),
      };
    }

    return NextResponse.json(
      {
        success: true,
        client: {
          id: client._id,
          businessName: client.businessName,
          pointOfContact: {
            name: client.pointOfContactName,
            email: client.pointOfContactEmail,
            phone: client.pointOfContactPhone,
          },
        },
        targetsAndDeliverables,
        numberOfServices: licenses.length,
        currentMonthStatus,
        accountManager,
        plan: planData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client dashboard error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching dashboard data' },
      { status: 500 }
    );
  }
}

