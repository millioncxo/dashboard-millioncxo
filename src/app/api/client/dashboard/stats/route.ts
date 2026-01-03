import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Invoice from '@/models/Invoice';
import License from '@/models/License';
import Client from '@/models/Client';

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

    // Fetch all invoices for this client
    const allInvoices = await Invoice.find({ clientId }).lean();

    // Calculate billing statistics
    const paidInvoices = allInvoices.filter(inv => inv.status === 'PAID');
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const outstandingInvoices = allInvoices.filter(inv => 
      inv.status === 'GENERATED' || inv.status === 'OVERDUE'
    );
    const outstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Get next invoice due date
    const upcomingInvoices = allInvoices
      .filter(inv => inv.status === 'GENERATED' && new Date(inv.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nextInvoiceDue = upcomingInvoices.length > 0 ? upcomingInvoices[0].dueDate.toISOString() : null;

    const upcomingCount = upcomingInvoices.length;
    const overdueCount = allInvoices.filter(inv => {
      if (inv.status === 'PAID') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < new Date();
    }).length;

    // Fetch licenses for service statistics
    const licenses = await License.find({ clientId }).lean();
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    const totalLicenses = licenses.length;

    // Get client data for total licenses
    const client = await Client.findById(clientId).lean();
    const clientTotalLicenses = (client as any)?.numberOfLicenses || totalLicenses;
    const utilizationPercent = clientTotalLicenses > 0 
      ? Math.round((activeLicenses / clientTotalLicenses) * 100) 
      : 0;

    // Calculate performance metrics
    const clientData = client as any;
    const target = clientData?.targetThisMonth || clientData?.numberOfLicenses || 0;
    const achieved = clientData?.achievedThisMonth || 0;
    const progressPercent = target > 0 ? Math.round((achieved / target) * 100) : 0;

    return NextResponse.json(
      {
        success: true,
        stats: {
          billing: {
            totalPaid,
            outstanding,
            nextInvoiceDue,
            upcomingCount,
            overdueCount,
          },
          services: {
            total: clientTotalLicenses,
            active: activeLicenses,
            utilizationPercent,
          },
          performance: {
            progressPercent,
            status: progressPercent >= 100 ? 'ACHIEVED' : progressPercent >= 75 ? 'ON_TRACK' : 'IN_PROGRESS',
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get client dashboard stats error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching dashboard statistics' },
      { status: 500 }
    );
  }
}

