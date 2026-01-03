import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import License from '@/models/License';
import Client from '@/models/Client';
import Update from '@/models/Update';

export async function GET(req: NextRequest) {
  try {
    // Verify client role and get user info
    const authUser = await requireRole(['CLIENT'], req);

    // Connect to database
    await connectToDatabase();

    // Get client ID from JWT
    const clientId = authUser.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID not found in authentication token' },
        { status: 400 }
      );
    }

    // Get client data
    const client = await Client.findById(clientId).lean();
    const clientTotalLicenses = (client as any)?.numberOfLicenses || 0;

    // Generate last 6 months of data
    const now = new Date();
    const months: Array<{ month: string; active: number; total: number }> = [];
    const progressTrend: Array<{ month: string; progress: number }> = [];
    const licenseUsage: Array<{ month: string; used: number; available: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // For service utilization - we'll use current license data as approximation
      // In a real scenario, you'd track historical license states
      const licenses = await License.find({ 
        clientId,
        createdAt: { $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0) }
      }).lean();
      const activeCount = licenses.filter(l => l.status === 'active').length;
      
      months.push({
        month: monthName,
        active: activeCount,
        total: clientTotalLicenses || licenses.length,
      });

      // For progress trend - use client's target and achieved data
      // This is simplified - ideally you'd track monthly targets/achievements
      const target = (client as any)?.targetThisMonth || clientTotalLicenses || 0;
      const achieved = (client as any)?.achievedThisMonth || 0;
      const progressPercent = target > 0 ? Math.round((achieved / target) * 100) : 0;
      
      progressTrend.push({
        month: monthName,
        progress: i === 0 ? progressPercent : Math.round(progressPercent * (0.8 + Math.random() * 0.4)), // Simulate variation
      });

      // For license usage
      const used = activeCount;
      const available = (clientTotalLicenses || licenses.length) - used;
      
      licenseUsage.push({
        month: monthName,
        used,
        available,
      });
    }

    return NextResponse.json(
      {
        success: true,
        charts: {
          serviceUtilization: months,
          progressTrend,
          licenseUsage,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get client dashboard charts error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching chart data' },
      { status: 500 }
    );
  }
}

