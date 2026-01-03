import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { updateChatHistorySchema, validateOrThrow } from '@/lib/validation-schemas';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void SdrClientAssignment;
  void Client;
}

// GET chat history for a client
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.read);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Validate ObjectId
    const validationError = validateObjectIdOrError(params.clientId, 'client id');
    if (validationError) return validationError;

    // Verify SDR role and get user info
    const authUser = await requireRole(['SDR'], req);

    // Connect to database
    await connectToDatabase();

    // Get SDR's user ID from JWT
    const sdrId = authUser.userId;

    // Check if SDR is assigned to this client
    const assignment = await SdrClientAssignment.findOne({
      sdrId,
      clientId: params.clientId,
    }).lean();

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this client' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        chatHistory: assignment.linkedInChatHistory || null,
        chatHistoryAddedAt: assignment.chatHistoryAddedAt || null,
        chatHistoryUpdatedAt: assignment.chatHistoryUpdatedAt || null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get chat history error', error, { clientId: params.clientId });
    return handleApiError(error);
  }
}

// PUT update chat history for a client
export async function PUT(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.write);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Validate ObjectId
    const validationError = validateObjectIdOrError(params.clientId, 'client id');
    if (validationError) return validationError;

    // Verify SDR role and get user info
    const authUser = await requireRole(['SDR'], req);

    // Connect to database
    await connectToDatabase();

    // Get SDR's user ID from JWT
    const sdrId = authUser.userId;

    // Parse and validate request body
    const body = await req.json();
    const validatedData = validateOrThrow(updateChatHistorySchema, body);
    const { chatHistory } = validatedData;

    // Check if SDR is assigned to this client
    const assignment = await SdrClientAssignment.findOne({
      sdrId,
      clientId: params.clientId,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this client' },
        { status: 403 }
      );
    }

    // Update chat history
    const now = new Date();
    const isNew = !assignment.linkedInChatHistory;

    assignment.linkedInChatHistory = chatHistory || undefined;
    if (isNew && chatHistory) {
      assignment.chatHistoryAddedAt = now;
    }
    if (chatHistory) {
      assignment.chatHistoryUpdatedAt = now;
    } else {
      // If clearing chat history, clear timestamps too
      assignment.chatHistoryAddedAt = undefined;
      assignment.chatHistoryUpdatedAt = undefined;
    }

    await assignment.save();

    return NextResponse.json(
      {
        success: true,
        message: isNew ? 'Chat history added successfully' : 'Chat history updated successfully',
        chatHistory: assignment.linkedInChatHistory,
        chatHistoryAddedAt: assignment.chatHistoryAddedAt,
        chatHistoryUpdatedAt: assignment.chatHistoryUpdatedAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Update chat history error', error, { clientId: params.clientId });
    return handleApiError(error);
  }
}

