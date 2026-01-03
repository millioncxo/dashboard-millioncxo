import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Update from '@/models/Update';
import SdrClientAssignment from '@/models/SdrClientAssignment';
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

    // Verify that the client has an SDR assignment (updates come from SDRs)
    const assignment = await SdrClientAssignment.findOne({ clientId }).lean();
    
    if (!assignment) {
      // No SDR assigned, return empty array
      return NextResponse.json(
        {
          success: true,
          updates: [],
        },
        { status: 200 }
      );
    }

    // Fetch client-visible updates only
    const updates = await Update.find({ clientId, visibleToClient: true })
      .populate('sdrId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(50) // Limit to last 50 updates
      .lean();

    return NextResponse.json(
      {
        success: true,
        updates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client updates error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching updates' },
      { status: 500 }
    );
  }
}

