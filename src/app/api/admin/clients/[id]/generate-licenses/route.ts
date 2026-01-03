import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import License from '@/models/License';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import { requireRole } from '@/lib/auth';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Validate ObjectId
    const idValidationError = validateObjectIdOrError(params.id, 'client id');
    if (idValidationError) return idValidationError;

    // Connect to database
    await connectToDatabase();

    // Fetch client
    const client = await Client.findById(params.id).lean();
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const numberOfLicenses = (client as any).numberOfLicenses || 0;
    if (numberOfLicenses === 0) {
      return NextResponse.json(
        { error: 'Client has numberOfLicenses set to 0. Please set numberOfLicenses first.' },
        { status: 400 }
      );
    }

    // Count existing licenses
    const existingLicensesCount = await License.countDocuments({ clientId: params.id });
    
    if (existingLicensesCount >= numberOfLicenses) {
      return NextResponse.json(
        { 
          success: true,
          message: `Client already has ${existingLicensesCount} license(s). No new licenses needed.`,
          licensesCreated: 0,
        },
        { status: 200 }
      );
    }

    // Generate missing licenses
    const licensesToCreate = numberOfLicenses - existingLicensesCount;
    const createdLicenses = [];
    const newLicenseIds = [];

    for (let i = 1; i <= licensesToCreate; i++) {
      const license = await License.create({
        clientId: params.id,
        productOrServiceName: `LinkedIn License ${existingLicensesCount + i}`,
        serviceType: 'LinkedIn Outreach',
        label: `License ${existingLicensesCount + i}`,
        status: 'active',
        startDate: new Date(),
      });
      createdLicenses.push(license);
      newLicenseIds.push(license._id);
    }

    // Auto-assign newly created licenses to existing SDR assignments for this client
    if (newLicenseIds.length > 0) {
      const existingAssignments = await SdrClientAssignment.find({ clientId: params.id });
      for (const assignment of existingAssignments) {
        // Add new licenses to existing assignment (avoid duplicates)
        const currentLicenseIds = (assignment.licenses || []).map((id: any) => id.toString());
        const newIds = newLicenseIds.map((id: any) => id.toString());
        const combinedIds = [...new Set([...currentLicenseIds, ...newIds])];
        
        await SdrClientAssignment.findByIdAndUpdate(
          assignment._id,
          { licenses: combinedIds },
          { new: true }
        );
      }
      if (existingAssignments.length > 0) {
        console.log(`✅ Auto-assigned ${newLicenseIds.length} new license(s) to ${existingAssignments.length} existing SDR assignment(s)`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully generated ${licensesToCreate} license(s)`,
        licensesCreated: licensesToCreate,
        licenses: createdLicenses,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Generate licenses error', error);
    return handleApiError(error);
  }
}

