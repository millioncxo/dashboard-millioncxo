import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { hashPassword, requireRole } from '@/lib/auth';
import { encryptPassword } from '@/lib/password-encryption';
import { updateUserSchema, validateOrThrow } from '@/lib/validation-schemas';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Parse request body
    const body = await req.json();

    // Validate input using Zod schema (includes email validation)
    let validatedData;
    try {
      validatedData = validateOrThrow(updateUserSchema, body);
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

    const { name, email, password, role, isActive } = validatedData;

    // Ensure required fields are present (Zod partial schema allows undefined, but we need these)
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user exists
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email: email.toLowerCase(),
      role,
      isActive: isActive !== undefined ? isActive : user.isActive,
    };

    // Only update password if provided
    if (password) {
      updateData.passwordHash = await hashPassword(password);
      updateData.passwordEncrypted = encryptPassword(password);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).select('-passwordHash');

    return NextResponse.json(
      {
        success: true,
        message: 'User updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Update user error', error, { userId: params.id });
    return handleApiError(error);
  }
}

