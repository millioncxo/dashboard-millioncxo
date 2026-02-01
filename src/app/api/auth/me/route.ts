import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { verifyAuthFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyAuthFromRequest(req);
    await connectToDatabase();

    const user = await User.findById(payload.userId).select('name email').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
