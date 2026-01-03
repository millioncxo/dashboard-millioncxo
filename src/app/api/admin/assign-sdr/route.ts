import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import User from '@/models/User';
import Client from '@/models/Client';
import License from '@/models/License';
import AuditLog from '@/models/AuditLog';
import { requireRole } from '@/lib/auth';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.write);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await req.json();
    const { sdrId, clientId, licenseIds = [] } = body;

    // Validate required fields
    if (!sdrId || !clientId) {
      return NextResponse.json(
        { error: 'sdrId and clientId are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    const sdrIdValidationError = validateObjectIdOrError(sdrId, 'SDR ID');
    if (sdrIdValidationError) return sdrIdValidationError;

    const clientIdValidationError = validateObjectIdOrError(clientId, 'client ID');
    if (clientIdValidationError) return clientIdValidationError;

    // Validate license IDs if provided
    if (licenseIds.length > 0) {
      for (const licenseId of licenseIds) {
        const licenseIdValidationError = validateObjectIdOrError(licenseId, 'license ID');
        if (licenseIdValidationError) return licenseIdValidationError;
      }
    }

    // Verify SDR exists and has SDR role
    const sdr = await User.findById(sdrId);
    if (!sdr) {
      return NextResponse.json(
        { error: 'SDR user not found' },
        { status: 404 }
      );
    }
    if (sdr.role !== 'SDR') {
      return NextResponse.json(
        { error: 'User is not an SDR' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // If no licenses are selected, auto-assign all licenses for this client
    let finalLicenseIds = licenseIds;
    if (licenseIds.length === 0) {
      const allClientLicenses = await License.find({ clientId }).select('_id').lean();
      finalLicenseIds = allClientLicenses.map((l: any) => l._id);
      console.log(`Auto-assigning ${finalLicenseIds.length} license(s) to SDR ${sdrId} for client ${clientId}`);
    }

    // Verify all licenses exist and belong to the client
    if (finalLicenseIds.length > 0) {
      const licenses = await License.find({ _id: { $in: finalLicenseIds } });
      if (licenses.length !== finalLicenseIds.length) {
        return NextResponse.json(
          { error: 'One or more licenses not found' },
          { status: 404 }
        );
      }

      // Check if all licenses belong to the client
      const invalidLicenses = licenses.filter(
        (license) => license.clientId.toString() !== clientId
      );
      if (invalidLicenses.length > 0) {
        return NextResponse.json(
          { error: 'One or more licenses do not belong to the specified client' },
          { status: 400 }
        );
      }
    }

    // Create or update assignment
    const assignment = await SdrClientAssignment.findOneAndUpdate(
      { sdrId, clientId },
      { sdrId, clientId, licenses: finalLicenseIds },
      { upsert: true, new: true }
    )
      .populate('sdrId', 'name email')
      .populate('clientId', 'businessName')
      .populate('licenses');

    return NextResponse.json(
      {
        success: true,
        message: 'SDR assigned to client successfully',
        assignment,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Assign SDR error', error);
    return handleApiError(error);
  }
}

// DELETE - Remove SDR assignment
export async function DELETE(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(req, rateLimitConfigs.write);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await req.json();
    const { assignmentId, sdrId, clientId } = body;

    // Validate required fields
    if (!assignmentId && (!sdrId || !clientId)) {
      return NextResponse.json(
        { error: 'assignmentId or both sdrId and clientId are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds if provided
    if (assignmentId) {
      const assignmentIdValidationError = validateObjectIdOrError(assignmentId, 'assignment ID');
      if (assignmentIdValidationError) return assignmentIdValidationError;
    }
    if (sdrId) {
      const sdrIdValidationError = validateObjectIdOrError(sdrId, 'SDR ID');
      if (sdrIdValidationError) return sdrIdValidationError;
    }
    if (clientId) {
      const clientIdValidationError = validateObjectIdOrError(clientId, 'client ID');
      if (clientIdValidationError) return clientIdValidationError;
    }

    // Get admin user info for audit log
    const authUser = await requireRole(['ADMIN'], req);
    const adminUserId = authUser.userId;

    // Find assignment before deleting (for audit log)
    let assignmentToDelete;
    if (assignmentId) {
      assignmentToDelete = await SdrClientAssignment.findById(assignmentId)
        .populate('sdrId', 'name email')
        .populate('clientId', 'businessName')
        .lean();
    } else {
      assignmentToDelete = await SdrClientAssignment.findOne({
        sdrId,
        clientId,
      })
        .populate('sdrId', 'name email')
        .populate('clientId', 'businessName')
        .lean();
    }

    if (!assignmentToDelete) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Create audit log entry before deletion
    await AuditLog.create({
      adminId: adminUserId,
      actionType: 'SDR_UNASSIGNED',
      entityType: 'SDR_ASSIGNMENT',
      entityId: assignmentToDelete._id,
      details: {
        sdrId: assignmentToDelete.sdrId?._id || sdrId,
        sdrName: (assignmentToDelete.sdrId as any)?.name,
        sdrEmail: (assignmentToDelete.sdrId as any)?.email,
        clientId: assignmentToDelete.clientId?._id || clientId,
        clientName: (assignmentToDelete.clientId as any)?.businessName,
        licenseIds: assignmentToDelete.licenses || [],
      },
      timestamp: new Date(),
    });

    // Delete assignment
    if (assignmentId) {
      await SdrClientAssignment.findByIdAndDelete(assignmentId);
    } else {
      await SdrClientAssignment.findOneAndDelete({
        sdrId,
        clientId,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'SDR assignment removed successfully',
        auditLogged: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Delete assignment error', error);
    return handleApiError(error);
  }
}

