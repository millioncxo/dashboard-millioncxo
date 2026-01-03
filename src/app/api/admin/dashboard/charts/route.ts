import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Client from '@/models/Client';
import Invoice from '@/models/Invoice';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get('months') || '12', 10);

    const now = new Date();
    // Include current month and next month to capture future-dated invoices
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // End of next month

    // Revenue trend (last N months)
    // Get all invoices first, then group by month
    const allInvoices = await Invoice.find().lean();
    
    // Debug: Log invoice data to understand the issue
    console.log('[Charts API] Total invoices found:', allInvoices.length);
    if (allInvoices.length > 0) {
      console.log('[Charts API] Sample invoice:', {
        amount: allInvoices[0].amount,
        status: allInvoices[0].status,
        invoiceMonth: allInvoices[0].invoiceMonth,
        invoiceYear: allInvoices[0].invoiceYear,
        invoiceDate: allInvoices[0].invoiceDate,
        createdAt: allInvoices[0].createdAt,
      });
    }
    
    const revenueTrend: Array<{ month: string; revenue: number; paid: number }> = [];
    
    // Include current month + next month to capture future-dated invoices
    for (let i = months - 1; i >= -1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonth = date.getMonth() + 1; // 1-12
      const targetYear = date.getFullYear();

      // Filter invoices for this month - prefer invoiceMonth/invoiceYear, fallback to invoiceDate or createdAt
      const monthInvoices = allInvoices.filter(inv => {
        // First try invoiceMonth/invoiceYear (most reliable)
        if (inv.invoiceMonth !== undefined && inv.invoiceMonth !== null && 
            inv.invoiceYear !== undefined && inv.invoiceYear !== null) {
          return inv.invoiceMonth === targetMonth && inv.invoiceYear === targetYear;
        }
        // Fallback to invoiceDate
        if (inv.invoiceDate) {
          const invDate = new Date(inv.invoiceDate);
          const invMonth = invDate.getMonth() + 1;
          const invYear = invDate.getFullYear();
          return invMonth === targetMonth && invYear === targetYear;
        }
        // Last resort: use createdAt
        const invDate = new Date(inv.createdAt);
        const invMonth = invDate.getMonth() + 1;
        const invYear = invDate.getFullYear();
        return invMonth === targetMonth && invYear === targetYear;
      });

      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      const monthPaid = monthInvoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

      // Debug for current month and next month
      if ((targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) ||
          (targetMonth === now.getMonth() + 2 && targetYear === now.getFullYear()) ||
          (targetMonth === 1 && targetYear === now.getFullYear() + 1 && now.getMonth() === 11)) {
        console.log(`[Charts API] Month (${targetMonth}/${targetYear}):`, {
          invoicesFound: monthInvoices.length,
          revenue: monthRevenue,
          paid: monthPaid,
          invoiceDetails: monthInvoices.map(inv => ({
            amount: inv.amount,
            status: inv.status,
            invoiceMonth: inv.invoiceMonth,
            invoiceYear: inv.invoiceYear,
          })),
        });
      }

      revenueTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        paid: monthPaid,
      });
    }

    // Client growth (cumulative total clients over time)
    const clientGrowth: Array<{ month: string; newClients: number; totalClients: number }> = [];
    let cumulativeTotal = 0;
    
    // First, get the total clients before the start date (baseline)
    const baselineDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const baselineCount = await Client.countDocuments({
      createdAt: { $lt: baselineDate },
    });
    cumulativeTotal = baselineCount;
    
    // Use Set to track months we've already processed (prevent duplicates)
    const processedMonths = new Set<string>();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      // Create unique month key to prevent duplicates
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Skip if we've already processed this month
      if (processedMonths.has(monthKey)) {
        continue;
      }
      processedMonths.add(monthKey);

      const newClients = await Client.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });
      
      cumulativeTotal += newClients;

      clientGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newClients,
        totalClients: cumulativeTotal,
      });
    }

    // Payment status distribution - removed per user request
    // SDR workload chart - removed per user request

    return NextResponse.json(
      {
        success: true,
        charts: {
          revenueTrend,
          clientGrowth,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get dashboard charts error:', error);

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

