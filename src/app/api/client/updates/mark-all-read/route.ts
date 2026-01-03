import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Update from '@/models/Update';
import { requireRole } from '@/lib/auth';

/**
 * Mark all updates as read for the client
 * PATCH /api/client/updates/mark-all-read
 */
export async function PATCH(req: NextRequest) {
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

    // Mark all unread updates as read
    const result = await Update.updateMany(
      { clientId, readByClient: { $ne: true } },
      {
        $set: {
          readByClient: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `${result.modifiedCount} updates marked as read`,
        count: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark all updates as read error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while marking updates as read' },
      { status: 500 }
    );
  }
}

