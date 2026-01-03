import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import Update from '@/models/Update';
import Client from '@/models/Client';
import User from '@/models/User';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import { requireRole } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { createUpdateSchema, validateOrThrow } from '@/lib/validation-schemas';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Update;
  void Client;
  void User;
  void SdrClientAssignment;
}

// GET all updates for a client
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
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this client' },
        { status: 403 }
      );
    }

    // Parse query parameters for pagination, filtering, and sorting
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { clientId: params.clientId };

    // Filter by type (comma-separated)
    const typeFilter = searchParams.get('type');
    if (typeFilter) {
      const types = typeFilter.split(',').map(t => t.trim().toUpperCase());
      filter.type = { $in: types };
    }

    // Filter by date range
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        filter.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        filter.date.$lte = endDate;
      }
    }

    // Search in title and description
    const search = searchParams.get('search');
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Build sort object
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
    
    const sort: any = {};
    if (sortBy === 'date') {
      sort.date = sortDirection;
      sort.createdAt = sortDirection; // Secondary sort
    } else if (sortBy === 'type') {
      sort.type = sortDirection;
      sort.date = -1; // Secondary sort
    } else if (sortBy === 'title') {
      sort.title = sortDirection;
      sort.date = -1; // Secondary sort
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortDirection;
      sort.date = -1; // Secondary sort
    } else {
      // Default sort
      sort.date = -1;
      sort.createdAt = -1;
    }

    // Fetch updates with filtering, sorting, and pagination
    const [updates, total] = await Promise.all([
      Update.find(filter)
        .populate('sdrId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Update.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        updates,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get updates error', error, { clientId: params.clientId });
    return handleApiError(error);
  }
}

// POST create a new update
export async function POST(
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = validateOrThrow(createUpdateSchema, body);
    const { type, title, description, date, attachments = [], chatHistory, visibleToClient = false, priority } = validatedData;

    // Create update
    const newUpdate = await Update.create({
      clientId: params.clientId,
      sdrId,
      type,
      title,
      description,
      date: date ? new Date(date) : new Date(),
      attachments,
      ...(chatHistory && { chatHistory }),
      visibleToClient: !!visibleToClient,
      ...(priority && { priority }),
    });

    // Populate SDR info for response
    const populatedUpdate = await Update.findById(newUpdate._id)
      .populate('sdrId', 'name email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Update created successfully',
        update: populatedUpdate,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('Create update error', error, { clientId: params.clientId });
    return handleApiError(error);
  }
}

