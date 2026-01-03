import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/models/Message';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import User from '@/models/User';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import { createMessageSchema, validateOrThrow, paginationSchema } from '@/lib/validation-schemas';
import { handleApiError } from '@/lib/error-handler';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import mongoose from 'mongoose';

/**
 * GET /api/messages
 * Retrieve messages between authenticated user and their counterpart
 * - For CLIENT: fetch messages between clientId and assigned SDR
 * - For SDR: fetch messages between sdrId and specified client (query param)
 * - Support pagination (limit, offset)
 * - Auto-mark messages as read when retrieved by recipient
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user (CLIENT or SDR)
    const authUser = await requireRole(['CLIENT', 'SDR'], req);
    
    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const clientIdParam = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let clientId: mongoose.Types.ObjectId;
    let sdrId: mongoose.Types.ObjectId;

    if (authUser.role === 'CLIENT') {
      // CLIENT users: use clientId from JWT token
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
        // Return empty messages array instead of error
        return NextResponse.json(
          {
            success: true,
            messages: [],
            pagination: {
              limit,
              offset,
              total: 0,
            },
            warning: 'No SDR assigned to this client',
          },
          { status: 200 }
        );
      }
      sdrId = new mongoose.Types.ObjectId(assignment.sdrId.toString());
    } else {
      // SDR users: require clientId query parameter
      if (!clientIdParam) {
        return NextResponse.json(
          { error: 'clientId query parameter is required for SDR users' },
          { status: 400 }
        );
      }

      // Validate clientId format
      if (!mongoose.Types.ObjectId.isValid(clientIdParam)) {
        return NextResponse.json(
          { error: 'Invalid clientId format' },
          { status: 400 }
        );
      }

      clientId = new mongoose.Types.ObjectId(clientIdParam);
      sdrId = new mongoose.Types.ObjectId(authUser.userId);

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

    // Reverse to show oldest first (for UI display)
    const reversedMessages = [...messages].reverse();

    return NextResponse.json(
      {
        success: true,
        messages: reversedMessages,
        pagination: {
          limit,
          offset,
          total: messages.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get messages error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/messages
 * Send a new message
 * - Validate sender has permission (CLIENT can only message assigned SDR, SDR can only message assigned clients)
 * - Verify client-SDR relationship exists via SdrClientAssignment
 * - Create new message with senderRole based on authenticated user
 * - Validate message text (max length, sanitization)
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 messages per minute
    const rateLimitResponse = rateLimit(req, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      message: 'Too many messages. Please wait a moment before sending another message.',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authenticate user (CLIENT or SDR)
    const authUser = await requireRole(['CLIENT', 'SDR'], req);

    // Connect to database
    await connectToDatabase();

    // Parse and validate request body
    const body = await req.json();
    const validatedData = validateOrThrow(createMessageSchema, body);

    // Sanitize message text (remove HTML tags, trim whitespace)
    const sanitizedText = validatedData.text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();

    if (!sanitizedText) {
      return NextResponse.json(
        { error: 'Message text cannot be empty' },
        { status: 400 }
      );
    }

    let clientId: mongoose.Types.ObjectId;
    let sdrId: mongoose.Types.ObjectId;
    let senderRole: 'CLIENT' | 'SDR';

    if (authUser.role === 'CLIENT') {
      // CLIENT users: use clientId from JWT token
      if (!authUser.clientId) {
        return NextResponse.json(
          { error: 'Client ID not found in authentication token' },
          { status: 400 }
        );
      }
      clientId = new mongoose.Types.ObjectId(authUser.clientId);
      senderRole = 'CLIENT';

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
      // SDR users: require clientId in request body
      if (!validatedData.clientId) {
        return NextResponse.json(
          { error: 'clientId is required for SDR users' },
          { status: 400 }
        );
      }

      if (!mongoose.Types.ObjectId.isValid(validatedData.clientId)) {
        return NextResponse.json(
          { error: 'Invalid clientId format' },
          { status: 400 }
        );
      }

      clientId = new mongoose.Types.ObjectId(validatedData.clientId);
      sdrId = new mongoose.Types.ObjectId(authUser.userId);
      senderRole = 'SDR';

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

    // Create message
    const message = new Message({
      clientId,
      sdrId,
      senderRole,
      text: sanitizedText,
      read: false,
    });

    await message.save();

    // Populate references for response
    const populatedMessage = await Message.findById(message._id)
      .populate('clientId', 'businessName pointOfContactName')
      .populate('sdrId', 'name email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: populatedMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Send message error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return handleApiError(error);
  }
}
