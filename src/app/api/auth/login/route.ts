import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { loginSchema, validateOrThrow } from '@/lib/validation-schemas';
import { ZodError } from 'zod';

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.login);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate input with Zod
    let validatedData;
    try {
      validatedData = validateOrThrow(loginSchema, body);
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
    
    const { email, password } = validatedData;

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT payload
    const payload = {
      userId: String(user._id),
      role: user.role,
      ...(user.clientId && { clientId: String(user.clientId) }),
    };

    // Sign JWT token
    const token = signToken(payload);

    // Set authentication cookie
    await setAuthCookie(token);

    // Return success response (without password hash)
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Login error', error);
    return handleApiError(error);
  }
}

