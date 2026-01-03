import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Report from '@/models/Report';
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build query
    const query: any = { clientId };

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
      .populate('licenseId', 'label serviceType')
      .populate('createdBy', 'name email')
      .sort({ periodStart: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        reports,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client reports error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching reports' },
      { status: 500 }
    );
  }
}

