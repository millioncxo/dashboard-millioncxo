import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/models/Message';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import mongoose from 'mongoose';

/**
 * GET /api/messages/unread
 * Get count of unread messages for authenticated user
 * - For CLIENT: count unread messages from assigned SDR
 * - For SDR: count unread messages from all assigned clients (grouped by client)
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user (CLIENT or SDR)
    const authUser = await requireRole(['CLIENT', 'SDR'], req);

    // Connect to database
    await connectToDatabase();

    if (authUser.role === 'CLIENT') {
      // CLIENT: Get unread count from assigned SDR
      if (!authUser.clientId) {
        return NextResponse.json(
          { error: 'Client ID not found in authentication token' },
          { status: 400 }
        );
      }

      const clientId = new mongoose.Types.ObjectId(authUser.clientId);

      // Get assigned SDR
      const assignment = await SdrClientAssignment.findOne({ clientId }).lean();
      if (!assignment) {
        return NextResponse.json(
          {
            success: true,
            unreadCount: 0,
          },
          { status: 200 }
        );
      }

      const sdrId = new mongoose.Types.ObjectId(assignment.sdrId.toString());

      // Count unread messages from SDR
      const unreadCount = await Message.countDocuments({
        clientId,
        sdrId,
        senderRole: 'SDR',
        read: false,
      });

      return NextResponse.json(
        {
          success: true,
          unreadCount,
        },
        { status: 200 }
      );
    } else {
      // SDR: Get unread counts grouped by client
      const sdrId = new mongoose.Types.ObjectId(authUser.userId);

      // Get all client assignments for this SDR
      const assignments = await SdrClientAssignment.find({ sdrId })
        .populate('clientId', 'businessName pointOfContactName')
        .lean();

      // Get unread counts for each client
      const unreadCounts = await Promise.all(
        assignments.map(async (assignment) => {
          const clientId = new mongoose.Types.ObjectId(assignment.clientId.toString());
          const unreadCount = await Message.countDocuments({
            clientId,
            sdrId,
            senderRole: 'CLIENT',
            read: false,
          });

          const client = assignment.clientId as any;

          return {
            clientId: clientId.toString(),
            clientName: client.businessName || 'Unknown Client',
            unreadCount,
          };
        })
      );

      // Filter out clients with zero unread messages
      const clientsWithUnread = unreadCounts.filter((item) => item.unreadCount > 0);
      const totalUnread = unreadCounts.reduce((sum, item) => sum + item.unreadCount, 0);

      return NextResponse.json(
        {
          success: true,
          unreadCounts: clientsWithUnread,
          totalUnread,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Get unread messages error:', error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/messages/unread
 * Mark messages as read
 * - Accept messageIds array or conversationId (clientId-sdrId pair)
 * - Mark specified messages as read
 * - Support marking all messages in a conversation as read
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authenticate user (CLIENT or SDR)
    const authUser = await requireRole(['CLIENT', 'SDR'], req);

    // Connect to database
    await connectToDatabase();

    const body = await req.json();
    const { messageIds, conversationId } = body;

    if (!messageIds && !conversationId) {
      return NextResponse.json(
        { error: 'Either messageIds or conversationId must be provided' },
        { status: 400 }
      );
    }

    let clientId: mongoose.Types.ObjectId;
    let sdrId: mongoose.Types.ObjectId;

    if (authUser.role === 'CLIENT') {
      if (!authUser.clientId) {
        return NextResponse.json(
          { error: 'Client ID not found in authentication token' },
          { status: 400 }
        );
      }
      clientId = new mongoose.Types.ObjectId(authUser.clientId);

      // Get assigned SDR
      const assignment = await SdrClientAssignment.findOne({ clientId }).lean();
      if (!assignment) {
        return NextResponse.json(
          { error: 'No SDR assigned to this client' },
          { status: 404 }
        );
      }
      sdrId = new mongoose.Types.ObjectId(assignment.sdrId.toString());
    } else {
      sdrId = new mongoose.Types.ObjectId(authUser.userId);

      if (conversationId) {
        // Parse conversationId format: "clientId-sdrId"
        const parts = conversationId.split('-');
        if (parts.length !== 2) {
          return NextResponse.json(
            { error: 'Invalid conversationId format. Expected: clientId-sdrId' },
            { status: 400 }
          );
        }

        if (!mongoose.Types.ObjectId.isValid(parts[0])) {
          return NextResponse.json(
            { error: 'Invalid clientId in conversationId' },
            { status: 400 }
          );
        }

        clientId = new mongoose.Types.ObjectId(parts[0]);

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
      } else if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
        // For messageIds, extract clientId from the first message
        const messages = await Message.find({
          _id: { $in: messageIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
        }).limit(1).lean();

        if (messages.length === 0) {
          return NextResponse.json(
            { error: 'No messages found with provided IDs' },
            { status: 404 }
          );
        }

        clientId = new mongoose.Types.ObjectId(messages[0].clientId.toString());
        
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
      } else {
        return NextResponse.json(
          { error: 'Either conversationId or messageIds must be provided for SDR' },
          { status: 400 }
        );
      }
    }

    let updateResult;

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      // Verify all messages belong to the correct conversation
      const messages = await Message.find({
        _id: { $in: messageIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      }).lean();

      // Verify all messages are for the correct client-SDR pair
      const invalidMessages = messages.filter(
        (msg) =>
          msg.clientId.toString() !== clientId.toString() ||
          msg.sdrId.toString() !== sdrId.toString()
      );

      if (invalidMessages.length > 0) {
        return NextResponse.json(
          { error: 'Some messages do not belong to this conversation' },
          { status: 403 }
        );
      }

      updateResult = await Message.updateMany(
        {
          _id: { $in: messageIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
        },
        { $set: { read: true } }
      );
    } else if (conversationId) {
      // Mark all messages in conversation as read
      // Only mark messages sent by the other party (not by the current user)
      const recipientRole = authUser.role === 'CLIENT' ? 'SDR' : 'CLIENT';

      updateResult = await Message.updateMany(
        {
          clientId,
          sdrId,
          senderRole: recipientRole,
          read: false,
        },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json(
        { error: 'Either messageIds array or conversationId must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        updated: updateResult.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    return handleApiError(error);
  }
}
