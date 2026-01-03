import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Plan from '@/models/Plan';
import License from '@/models/License';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify client role and get user info
    const authUser = await requireRole(['CLIENT'], req);

    // Connect to database
    await connectToDatabase();

    // Get client ID from JWT
    const clientId = authUser.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found in authentication token' },
        { status: 400 }
      );
    }

    // Fetch client information - ensure all fields are included
    const client = await Client.findById(clientId).lean();

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

    // Fetch licenses to count them if numberOfLicenses is 0
    const licenses = await License.find({ clientId }).lean();
    
    // Use numberOfLicenses from client, or count of licenses if numberOfLicenses is 0 or missing
    const totalLicenses = client.numberOfLicenses > 0 ? client.numberOfLicenses : licenses.length;

    // Fetch plan details if client has a plan
    let planDetails = null;
    const clientData = client as any;
    
    // Determine plan name - use customPlanName if set, otherwise fetch from Plan model
    let planName = clientData.customPlanName || null;
    if (client.currentPlanId && !planName) {
      const plan = await Plan.findById(client.currentPlanId).lean();
      if (plan) {
        planName = plan.name;
      }
    }

    // Build plan details with all new fields
    if (planName || clientData.planType || clientData.pricePerLicense) {
      planDetails = {
        name: planName || 'No Plan Assigned',
        licensesPerMonth: totalLicenses,
        numberOfLicenses: totalLicenses,
        planType: clientData.planType || null,
        pricePerLicense: clientData.pricePerLicense || null,
        currency: clientData.currency || 'USD',
        totalCostOfService: clientData.pricePerLicense && totalLicenses 
          ? clientData.pricePerLicense * totalLicenses 
          : 0,
        };
    }

    return NextResponse.json(
      {
        success: true,
        plan: planDetails,
        licensesAvailable: totalLicenses,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client plan error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching plan data' },
      { status: 500 }
    );
  }
}

