import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/models/Message';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import mongoose from 'mongoose';

/**
 * GET /api/messages/[conversationId]
 * Retrieve all messages for a specific conversation
 * - Parse conversationId as clientId-sdrId format
 * - Verify authenticated user has access to this conversation
 * - Return all messages for the conversation with pagination
 * - Auto-mark messages as read for the requesting user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // Authenticate user (CLIENT or SDR)
    const authUser = await requireRole(['CLIENT', 'SDR'], req);

    // Connect to database
    await connectToDatabase();

    const { conversationId } = params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Parse conversationId format: "clientId-sdrId"
    const parts = conversationId.split('-');
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid conversationId format. Expected: clientId-sdrId' },
        { status: 400 }
      );
    }

    const [clientIdStr, sdrIdStr] = parts;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(clientIdStr) || !mongoose.Types.ObjectId.isValid(sdrIdStr)) {
      return NextResponse.json(
        { error: 'Invalid ObjectId format in conversationId' },
        { status: 400 }
      );
    }

    const clientId = new mongoose.Types.ObjectId(clientIdStr);
    const sdrId = new mongoose.Types.ObjectId(sdrIdStr);

    // Verify user has access to this conversation
    if (authUser.role === 'CLIENT') {
      // CLIENT: verify this is their clientId and the SDR is assigned
      if (!authUser.clientId || authUser.clientId !== clientIdStr) {
        return NextResponse.json(
          { error: 'You do not have access to this conversation' },
          { status: 403 }
        );
      }

      // Verify SDR is assigned to this client
      const assignment = await SdrClientAssignment.findOne({
        clientId,
        sdrId,
      }).lean();

      if (!assignment) {
        return NextResponse.json(
          { error: 'SDR is not assigned to this client' },
          { status: 403 }
        );
      }
    } else {
      // SDR: verify this is their sdrId and they are assigned to the client
      if (authUser.userId !== sdrIdStr) {
        return NextResponse.json(
          { error: 'You do not have access to this conversation' },
          { status: 403 }
        );
      }

      // Verify SDR is assigned to this client
      const assignment = await SdrClientAssignment.findOne({
        clientId,
        sdrId,
      }).lean();

      if (!assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to this client' },
          { status: 403 }
        );
      }
    }

    // Fetch messages
    const messages = await Message.find({
      clientId,
      sdrId,
    })
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .skip(offset)
      .lean();

    // Mark messages as read for the recipient
    const recipientRole = authUser.role === 'CLIENT' ? 'SDR' : 'CLIENT';
    const unreadMessages = messages.filter(
      (msg) => !msg.read && msg.senderRole === recipientRole
    );

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((msg) => msg._id);
      await Message.updateMany(
        { _id: { $in: unreadIds } },
        { $set: { read: true } }
      );
    }

    // Get total count for pagination
    const totalCount = await Message.countDocuments({
      clientId,
      sdrId,
    });

    // Reverse to show oldest first (for UI display)
    const reversedMessages = messages.reverse();

    return NextResponse.json(
      {
        success: true,
        messages: reversedMessages,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + messages.length < totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get conversation messages error:', error);
    return handleApiError(error);
  }
}
