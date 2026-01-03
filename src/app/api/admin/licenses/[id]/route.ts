import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import License from '@/models/License';
import { requireRole } from '@/lib/auth';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Validate ObjectId
    const idValidationError = validateObjectIdOrError(params.id, 'license id');
    if (idValidationError) return idValidationError;

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await req.json();
    const { productOrServiceName, serviceType, label, status, startDate, endDate } = body;

    // Build update object
    const updateData: any = {};
    if (productOrServiceName !== undefined) updateData.productOrServiceName = productOrServiceName;
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (label !== undefined) updateData.label = label;
    if (status !== undefined) {
      if (!['active', 'paused'].includes(status)) {
        return NextResponse.json(
          { error: 'Status must be either "active" or "paused"' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Update license
    const license = await License.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'License updated successfully',
        license,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Update license error', error);
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Validate ObjectId
    const idValidationError = validateObjectIdOrError(params.id, 'license id');
    if (idValidationError) return idValidationError;

    // Connect to database
    await connectToDatabase();

    const license = await License.findByIdAndDelete(params.id);

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'License deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Delete license error', error);
    return handleApiError(error);
  }
}

