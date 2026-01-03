import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
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

    const invoice = await Invoice.findById(invoiceId)
      .populate('clientId', 'businessName pointOfContactName pointOfContactEmail fullRegisteredAddress')
      .lean();

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoice: {
          _id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          clientId: {
            _id: invoice.clientId._id.toString(),
            businessName: (invoice.clientId as any).businessName,
            pointOfContactName: (invoice.clientId as any).pointOfContactName,
            pointOfContactEmail: (invoice.clientId as any).pointOfContactEmail,
            fullRegisteredAddress: (invoice.clientId as any).fullRegisteredAddress,
          },
          invoiceDate: invoice.invoiceDate || invoice.createdAt,
          dueDate: invoice.dueDate,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          paymentDate: invoice.paidAt || null,
          fileId: invoice.fileId || null,
          description: invoice.description,
          notes: invoice.notes,
          paymentTerms: invoice.paymentTerms,
          typeOfService: invoice.typeOfService,
          numberOfServices: invoice.numberOfServices,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get invoice error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { amount, dueDate, status, description, notes, paymentTerms } = body;

    // Update fields if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) {
        return NextResponse.json(
          { error: 'Invalid amount. Must be a positive number.' },
          { status: 400 }
        );
      }
      invoice.amount = amount;
    }

    if (dueDate !== undefined) {
      invoice.dueDate = new Date(dueDate);
    }

    if (status !== undefined) {
      if (!['GENERATED', 'PAID', 'OVERDUE'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be GENERATED, PAID, or OVERDUE.' },
          { status: 400 }
        );
      }
      invoice.status = status;
      if (status === 'PAID' && !invoice.paidAt) {
        invoice.paidAt = new Date();
      } else if (status !== 'PAID') {
        invoice.paidAt = undefined;
      }
    }

    if (description !== undefined) {
      invoice.description = description;
    }

    if (notes !== undefined) {
      invoice.notes = notes;
    }

    if (paymentTerms !== undefined) {
      invoice.paymentTerms = paymentTerms;
    }

    await invoice.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice updated successfully',
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          status: invoice.status,
          description: invoice.description,
          notes: invoice.notes,
          paymentTerms: invoice.paymentTerms,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update invoice error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while updating invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const invoice = await Invoice.findByIdAndDelete(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // TODO: Optionally delete the PDF file from GridFS if fileId exists
    // For now, we'll leave the file in GridFS

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete invoice error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while deleting invoice' },
      { status: 500 }
    );
  }
}

