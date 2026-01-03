import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Plan from '@/models/Plan';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

export async function PUT(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const planId = params.planId;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description, pricePerMonth } = body;

    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (pricePerMonth !== undefined) plan.pricePerMonth = pricePerMonth ? parseFloat(pricePerMonth) : undefined;

    await plan.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Plan updated successfully',
        plan,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update plan error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while updating plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN'], req);
    await connectToDatabase();
    const adminUserId = authUser.userId;

    const planId = params.planId;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { isActive } = body;

    // If trying to deactivate, check if plan is in use
    if (isActive === false && plan.isActive !== false) {
      const Client = (await import('@/models/Client')).default;
      const clientsUsingPlan = await Client.countDocuments({ currentPlanId: planId });

      if (clientsUsingPlan > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate plan. It is currently assigned to ${clientsUsingPlan} client(s).` },
          { status: 400 }
        );
      }
    }

    // Update isActive status
    plan.isActive = isActive !== undefined ? isActive : plan.isActive;
    await plan.save();

    // Create audit log entry
    const AuditLog = (await import('@/models/AuditLog')).default;
    await AuditLog.create({
      adminId: adminUserId,
      actionType: isActive ? 'PLAN_ACTIVATED' : 'PLAN_DEACTIVATED',
      entityType: 'PLAN',
      entityId: plan._id,
      details: {
        planName: plan.name,
        previousStatus: plan.isActive === isActive ? isActive : !isActive,
        newStatus: isActive,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Plan ${isActive ? 'activated' : 'deactivated'} successfully`,
        plan,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Toggle plan status error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while updating plan status' },
      { status: 500 }
    );
  }
}

