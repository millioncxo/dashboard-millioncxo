import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Plan from '@/models/Plan';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    // Get all plans
    const plans = await Plan.find().lean();

    // Count clients using each plan
    const usage = await Promise.all(
      plans.map(async (plan) => {
        const clientCount = await Client.countDocuments({
          currentPlanId: plan._id,
        });
        return {
          planId: plan._id.toString(),
          clientCount,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        usage,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get plan usage error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching plan usage' },
      { status: 500 }
    );
  }
}

