import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { hashPassword, requireRole } from '@/lib/auth';
import { encryptPassword } from '@/lib/password-encryption';
import { notifyAndEmail } from '@/lib/notify';
import { createUserSchema, validateOrThrow } from '@/lib/validation-schemas';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const query: any = {};
    if (role) {
      query.role = role;
    } else {
      // By default, exclude CLIENT users (they are not team members)
      query.role = { $in: ['ADMIN', 'SDR'] };
    }

    const users = await User.find(query)
      .populate('clientId', 'businessName')
      .select('-passwordHash')
      .lean();

    return NextResponse.json(
      {
        success: true,
        users,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get users error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Parse request body
    const body = await req.json();

    // Validate input using Zod schema (includes email validation)
    let validatedData;
    try {
      validatedData = validateOrThrow(createUserSchema, body);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errorMessages = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
      return NextResponse.json(
          { error: errorMessages.join(', ') },
        { status: 400 }
      );
    }
      throw error;
    }

    const { name, email, password, role, clientId, isActive = true } = validatedData;

    // If role is CLIENT, clientId is required
    if (role === 'CLIENT' && !clientId) {
      return NextResponse.json(
        { error: 'clientId is required for CLIENT role' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password (for authentication)
    const passwordHash = await hashPassword(password);
    // Encrypt password (for admin viewing)
    const passwordEncrypted = encryptPassword(password);

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      passwordEncrypted,
      role,
      ...(clientId && { clientId }),
      isActive,
    });

    // Notify + email (if applicable)
    await notifyAndEmail({
      type: 'USER_CREATED',
      message: `User created: ${newUser.name} (${newUser.role})`,
      email: newUser.email,
    });

    // Return created user (without password hash)
    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          clientId: newUser.clientId,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('Create user error', error);
    return handleApiError(error);
  }
}

