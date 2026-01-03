import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Client from '@/models/Client';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import SdrClientAssignment from '@/models/SdrClientAssignment';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    // Get total clients
    const totalClients = await Client.countDocuments();

    // Get total SDRs
    const totalSdrs = await User.countDocuments({ role: 'SDR', isActive: true });

    // Get active assignments
    const activeAssignments = await SdrClientAssignment.countDocuments();

    // Get all invoices for revenue calculation
    const allInvoices = await Invoice.find().lean();

    // Calculate revenue metrics
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = allInvoices.filter(inv => inv.status === 'PAID');
    const paidRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingRevenue = totalRevenue - paidRevenue;

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Revenue this month
    const thisMonthInvoices = allInvoices.filter(inv => {
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt);
      return invDate.getMonth() + 1 === currentMonth && invDate.getFullYear() === currentYear;
    });
    const revenueThisMonth = thisMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Revenue this year
    const thisYearInvoices = allInvoices.filter(inv => {
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt);
      return invDate.getFullYear() === currentYear;
    });
    const revenueThisYear = thisYearInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Count invoices by status
    const activeInvoices = allInvoices.filter(inv => inv.status === 'GENERATED').length;
    const overdueInvoices = allInvoices.filter(inv => {
      if (inv.status === 'PAID') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    }).length;
    const paidInvoicesCount = paidInvoices.length;

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalClients,
          totalSdrs,
          activeAssignments,
          revenue: {
            total: totalRevenue,
            thisMonth: revenueThisMonth,
            thisYear: revenueThisYear,
            paid: paidRevenue,
            outstanding: outstandingRevenue,
          },
          invoices: {
            total: allInvoices.length,
            active: activeInvoices,
            overdue: overdueInvoices,
            paid: paidInvoicesCount,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);

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

