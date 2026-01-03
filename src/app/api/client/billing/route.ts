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

    const now = new Date();

    // Fetch upcoming invoices (GENERATED status)
    const upcomingInvoices = await Invoice.find({
      clientId,
      status: 'GENERATED',
      dueDate: { $gte: now },
    })
      .sort({ dueDate: 1 })
      .lean();

    // Fetch overdue invoices
    const overdueInvoices = await Invoice.find({
      clientId,
      status: 'OVERDUE',
    })
      .sort({ dueDate: 1 })
      .lean();

    // Fetch paid invoices (history)
    const paidInvoices = await Invoice.find({
      clientId,
      status: 'PAID',
    })
      .sort({ paidAt: -1 })
      .limit(20)
      .lean();

    // Format invoices to include invoiceNumber, description, and fileId
    const formatInvoice = (invoice: any) => ({
      ...invoice,
      invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id.toString().substring(0, 8).toUpperCase()}`,
      description: invoice.description || invoice.typeOfService || 'Service Invoice',
      fileId: invoice.fileId || null, // GridFS file ID
    });

    return NextResponse.json(
      {
        success: true,
        billing: {
          upcoming: upcomingInvoices.map(formatInvoice),
          overdue: overdueInvoices.map(formatInvoice),
          history: paidInvoices.map(formatInvoice),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client billing error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching billing data' },
      { status: 500 }
    );
  }
}

