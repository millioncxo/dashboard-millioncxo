import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

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

    // Fetch invoices with fileIds
    const invoices = await Invoice.find({
      _id: { $in: validIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      fileId: { $exists: true, $ne: null },
    })
      .populate('clientId', 'businessName')
      .lean();

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'No invoices with PDF files found' },
        { status: 404 }
      );
    }

    // For now, return the list of file IDs and client info
    // TODO: Install 'archiver' package and implement ZIP creation
    // For now, frontend can download files individually
    return NextResponse.json(
      {
        success: true,
        message: 'Bulk download requires archiver package. Returning file list for individual downloads.',
        invoices: invoices.map((inv: any) => ({
          invoiceId: inv._id.toString(),
          invoiceNumber: inv.invoiceNumber,
          clientId: inv.clientId._id.toString(),
          clientName: inv.clientId.businessName,
          fileId: inv.fileId,
          downloadUrl: `/api/admin/clients/${inv.clientId._id}/invoice/${inv.fileId}`,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Bulk download error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while processing bulk download' },
      { status: 500 }
    );
  }
}

