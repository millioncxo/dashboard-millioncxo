import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Report from '@/models/Report';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const reportId = params.reportId;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Get report with all populated fields
    const report = await Report.findById(reportId)
      .populate('clientId', 'businessName pointOfContactName pointOfContactEmail')
      .populate('createdBy', 'name email role')
      .populate('licenseId', 'productOrServiceName serviceType label')
      .lean();

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Format report for response
    const formattedReport = {
      _id: report._id.toString(),
      type: report.type,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      summary: report.summary,
      metrics: report.metrics || {},
      inMailsSent: report.inMailsSent || 0,
      inMailsPositiveResponse: report.inMailsPositiveResponse || 0,
      connectionRequestsSent: report.connectionRequestsSent || 0,
      connectionRequestsPositiveResponse: report.connectionRequestsPositiveResponse || 0,
      clientId: {
        _id: (report.clientId as any)._id?.toString() || (report.clientId as any).toString(),
        businessName: (report.clientId as any).businessName || 'Unknown Client',
        pointOfContactName: (report.clientId as any).pointOfContactName,
        pointOfContactEmail: (report.clientId as any).pointOfContactEmail,
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
      updatedAt: report.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        report: formattedReport,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get report error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching report' },
      { status: 500 }
    );
  }
}

