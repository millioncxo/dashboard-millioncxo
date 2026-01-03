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
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const invoiceId = params.invoiceId;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already marked as paid' },
        { status: 400 }
      );
    }

    // Get optional payment date from body
    const body = await req.json().catch(() => ({}));
    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    // Update invoice
    invoice.status = 'PAID';
    invoice.paidAt = paymentDate;
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

