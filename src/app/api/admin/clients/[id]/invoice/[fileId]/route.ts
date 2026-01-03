import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import { downloadFileFromGridFS } from '@/lib/gridfs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Get client ID and file ID from params
    const clientId = params.id;
    const fileId = params.fileId;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Verify invoice exists and belongs to this client
    const invoice = await Invoice.findOne({ clientId, fileId });
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or does not belong to this client' },
        { status: 404 }
      );
    }

    // Download file from GridFS
    const fileData = await downloadFileFromGridFS(fileId);

    // Convert Buffer to Uint8Array for NextResponse
    const fileBuffer = Buffer.isBuffer(fileData.buffer) 
      ? new Uint8Array(fileData.buffer) 
      : fileData.buffer;

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileData.contentType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileData.filename}"`,
        'Content-Length': fileData.buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Invoice download error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    if (error.message.includes('File not found')) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while downloading invoice' },
      { status: 500 }
    );
  }
}

