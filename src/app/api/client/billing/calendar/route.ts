import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';

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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Validate year and month
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month' },
        { status: 400 }
      );
    }

    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch invoices for this client in the specified month
    // Use invoiceDate if available, otherwise use createdAt
    const invoices = await Invoice.find({
      clientId,
      $or: [
        { invoiceDate: { $gte: startDate, $lte: endDate } },
        { 
          invoiceDate: { $exists: false },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    // Format invoices with invoice date and payment date
    const formattedInvoices = invoices.map((invoice: any) => {
      const invoiceDate = invoice.invoiceDate || invoice.createdAt;
      return {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id.toString().substring(0, 8).toUpperCase()}`,
        invoiceDate: invoiceDate,
        paymentDate: invoice.paidAt || null,
        amountPaid: invoice.status === 'PAID' ? invoice.amount : 0,
        amount: invoice.amount,
        currency: invoice.currency || 'USD',
        status: invoice.status,
        description: invoice.description || invoice.typeOfService || 'Service Invoice',
        dueDate: invoice.dueDate,
      };
    });

    // Group invoices by day for calendar view
    const invoicesByDay: Record<number, typeof formattedInvoices> = {};
    formattedInvoices.forEach((invoice) => {
      const day = new Date(invoice.invoiceDate).getDate();
      if (!invoicesByDay[day]) {
        invoicesByDay[day] = [];
      }
      invoicesByDay[day].push(invoice);
    });

    return NextResponse.json(
      {
        success: true,
        year,
        month,
        invoices: formattedInvoices,
        invoicesByDay,
        totalInvoices: formattedInvoices.length,
        totalPaid: formattedInvoices
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + inv.amountPaid, 0),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client calendar error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching calendar data' },
      { status: 500 }
    );
  }
}

