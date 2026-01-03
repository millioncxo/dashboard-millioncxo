import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Plan from '@/models/Plan';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const plans = await Plan.find().sort({ name: 1 }).lean();

    return NextResponse.json(
      {
        success: true,
        plans,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get plans error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching plans' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const body = await req.json();
    const { name, description, pricePerMonth } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      );
    }

    const plan = await Plan.create({
      name,
      description: description || '',
      pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Plan created successfully',
        plan,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create plan error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A plan with this name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while creating plan' },
      { status: 500 }
    );
  }
}

