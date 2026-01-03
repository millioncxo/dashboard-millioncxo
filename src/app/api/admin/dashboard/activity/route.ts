import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Report from '@/models/Report';
import Update from '@/models/Update';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Calculate 5 hours ago timestamp
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    const activities: Array<{
      type: string;
      title: string;
      description: string;
      date: Date;
      clientId?: string;
      clientName?: string;
    }> = [];

    // Recent invoice generations (last 5 hours only)
    const recentInvoices = await Invoice.find({
      createdAt: { $gte: fiveHoursAgo }
    })
      .populate('clientId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    recentInvoices.forEach((inv: any) => {
      activities.push({
        type: 'INVOICE_GENERATED',
        title: 'Invoice Generated',
        description: `Invoice ${inv.invoiceNumber || inv._id.toString().substring(0, 8)} for ${inv.clientId?.businessName || 'Unknown Client'}`,
        date: inv.createdAt,
        clientId: inv.clientId?._id?.toString(),
        clientName: inv.clientId?.businessName,
      });
    });

    // Recent payments (last 5 hours only)
    const recentPayments = await Invoice.find({ 
      status: 'PAID', 
      paidAt: { $exists: true, $gte: fiveHoursAgo }
    })
      .populate('clientId', 'businessName')
      .sort({ paidAt: -1 })
      .limit(limit)
      .lean();

    recentPayments.forEach((inv: any) => {
      activities.push({
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        description: `Payment of ${inv.currency} ${inv.amount.toFixed(2)} for invoice ${inv.invoiceNumber || inv._id.toString().substring(0, 8)} from ${inv.clientId?.businessName || 'Unknown Client'}`,
        date: inv.paidAt,
        clientId: inv.clientId?._id?.toString(),
        clientName: inv.clientId?.businessName,
      });
    });

    // Recent client updates (last 5 hours only)
    const recentClients = await Client.find({
      updatedAt: { $gte: fiveHoursAgo }
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    recentClients.forEach((client: any) => {
      const isNew = client.createdAt.getTime() === client.updatedAt.getTime();
      activities.push({
        type: isNew ? 'CLIENT_CREATED' : 'CLIENT_UPDATED',
        title: isNew ? 'Client Created' : 'Client Updated',
        description: `${client.businessName} ${isNew ? 'was created' : 'was updated'}`,
        date: client.updatedAt,
        clientId: client._id.toString(),
        clientName: client.businessName,
      });
    });

    // Recent assignments (last 5 hours only)
    const recentAssignments = await SdrClientAssignment.find({
      createdAt: { $gte: fiveHoursAgo }
    })
      .populate('sdrId', 'name email')
      .populate('clientId', 'businessName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    recentAssignments.forEach((assignment: any) => {
      activities.push({
        type: 'SDR_ASSIGNED',
        title: 'SDR Assigned',
        description: `${assignment.sdrId?.name || 'Unknown SDR'} assigned to ${assignment.clientId?.businessName || 'Unknown Client'}`,
        date: assignment.createdAt,
        clientId: assignment.clientId?._id?.toString(),
        clientName: assignment.clientId?.businessName,
      });
    });

    // Recent reports (last 5 hours only)
    const recentReports = await Report.find({
      createdAt: { $gte: fiveHoursAgo }
    })
      .populate('clientId', 'businessName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    recentReports.forEach((report: any) => {
      activities.push({
        type: 'REPORT_CREATED',
        title: 'Report Created',
        description: `${report.type} report created for ${report.clientId?.businessName || 'Unknown Client'} by ${report.createdBy?.name || 'Unknown'}`,
        date: report.createdAt,
        clientId: report.clientId?._id?.toString(),
        clientName: report.clientId?.businessName,
      });
    });

    // Sort all activities by date (most recent first) and limit
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        activities: limitedActivities.map(act => ({
          ...act,
          date: act.date.toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get dashboard activity error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching activity feed' },
      { status: 500 }
    );
  }
}

