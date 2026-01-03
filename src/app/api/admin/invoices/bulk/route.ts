import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/admin/invoices/bulk/mark-paid
export async function POST(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const body = await req.json();
    const { invoiceIds } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: 'invoiceIds array is required' },
        { status: 400 }
      );
    }

    // Validate all invoice IDs
    const validIds = invoiceIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid invoice IDs provided' },
        { status: 400 }
      );
    }

    // Get payment date (optional)
    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    // Update all invoices
    const result = await Invoice.updateMany(
      { 
        _id: { $in: validIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
        status: { $ne: 'PAID' }
      },
      {
        $set: {
          status: 'PAID',
          paidAt: paymentDate,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `${result.modifiedCount} invoice(s) marked as paid successfully`,
        modifiedCount: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Bulk mark paid error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while processing bulk operation' },
      { status: 500 }
    );
  }
}


