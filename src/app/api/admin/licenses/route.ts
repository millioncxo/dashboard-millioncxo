import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import License from '@/models/License';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/licenses
 * Fetch licenses, optionally filtered by clientId
 * Query params: ?clientId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    // Build query
    const query: any = {};
    if (clientId) {
      query.clientId = clientId;
    }

    // Fetch licenses
    const licenses = await License.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        licenses,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get licenses error', error);
    return handleApiError(error);
  }
}

