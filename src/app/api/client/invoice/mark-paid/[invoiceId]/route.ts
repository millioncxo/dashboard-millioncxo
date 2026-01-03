import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
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

    // Get invoice ID from params
    const invoiceId = params.invoiceId;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Verify invoice exists and belongs to this client
    const invoice = await Invoice.findOne({
      _id: new mongoose.Types.ObjectId(invoiceId),
      clientId: new mongoose.Types.ObjectId(clientId),
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already marked as paid' },
        { status: 400 }
      );
    }

    // Update invoice status to PAID
    invoice.status = 'PAID';
    invoice.paidAt = new Date();
    await invoice.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice marked as paid successfully',
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          paidAt: invoice.paidAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mark invoice paid error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while marking invoice as paid' },
      { status: 500 }
    );
  }
}
