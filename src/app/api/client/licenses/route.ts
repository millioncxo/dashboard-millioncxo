import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
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

    // Fetch all licenses for this client
    const licenses = await License.find({ clientId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        licenses,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client licenses error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching licenses' },
      { status: 500 }
    );
  }
}

