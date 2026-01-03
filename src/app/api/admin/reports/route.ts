import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Report from '@/models/Report';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    // Get all reports with client and creator information
    const reports = await Report.find()
      .populate('clientId', 'businessName')
      .populate('createdBy', 'name email role')
      .populate('licenseId', 'productOrServiceName serviceType label')
      .sort({ createdAt: -1 })
      .lean();

    // Format reports for response
    const formattedReports = reports.map((report: any) => ({
      _id: report._id.toString(),
      type: report.type,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      summary: report.summary,
      clientId: {
        _id: (report.clientId as any)._id?.toString() || (report.clientId as any).toString(),
        businessName: (report.clientId as any).businessName || 'Unknown Client',
      },
      createdBy: report.createdBy ? {
        _id: (report.createdBy as any)._id?.toString() || (report.createdBy as any).toString(),
        name: (report.createdBy as any).name,
        email: (report.createdBy as any).email,
        role: (report.createdBy as any).role,
      } : null,
      licenseId: report.licenseId ? {
        _id: (report.licenseId as any)._id?.toString() || (report.licenseId as any).toString(),
        productOrServiceName: (report.licenseId as any).productOrServiceName,
        serviceType: (report.licenseId as any).serviceType,
        label: (report.licenseId as any).label,
      } : null,
      createdAt: report.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        reports: formattedReports,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get reports error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching reports' },
      { status: 500 }
    );
  }
}

