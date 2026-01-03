import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Update from '@/models/Update';
import { requireRole } from '@/lib/auth';

/**
 * Mark an update as read by the client
 * PATCH /api/client/updates/[id]/read
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Find the update and verify it belongs to this client
    const update = await Update.findOne({ _id: id, clientId });

    if (!update) {
      return NextResponse.json(
        { error: 'Update not found or access denied' },
        { status: 404 }
      );
    }

    // Mark as read
    update.readByClient = true;
    update.readAt = new Date();
    await update.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Update marked as read',
        update: {
          _id: update._id,
          readByClient: update.readByClient,
          readAt: update.readAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark update as read error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while marking update as read' },
      { status: 500 }
    );
  }
}

