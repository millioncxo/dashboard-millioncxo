import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/auth';
import { decryptPassword } from '@/lib/password-encryption';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/users/[id]/password
 * Returns the decrypted password for a user (admin only)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Find user
    const user = await User.findById(params.id).select('passwordEncrypted name email');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if encrypted password exists
    if (!user.passwordEncrypted) {
      return NextResponse.json(
        { 
          error: 'Password not available',
          message: 'This user was created before password encryption was enabled. Please reset their password to enable viewing.'
        },
        { status: 404 }
      );
    }

    // Decrypt password
    try {
      const decryptedPassword = decryptPassword(user.passwordEncrypted);
      
      return NextResponse.json(
        {
          success: true,
          password: decryptedPassword,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        },
        { status: 200 }
      );
    } catch (decryptError) {
      logger.error('Password decryption error', decryptError, { userId: params.id });
      return NextResponse.json(
        { 
          error: 'Failed to decrypt password',
          message: 'The password could not be decrypted. This may indicate a key mismatch or corrupted data.'
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logger.error('Get password error', error, { userId: params.id });
    return handleApiError(error);
  }
}

