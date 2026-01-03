import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Contract from '@/models/Contract';
import { requireRole } from '@/lib/auth';
import { downloadFileFromGridFS } from '@/lib/gridfs';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await requireRole(['CLIENT'], req);
    await connectToDatabase();
    return NextResponse.json(
      { error: 'Contract download has been disabled by admin policy' },
      { status: 410 }
    );
  } catch (error: any) {
    console.error('Client contract download error:', error);

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
      { error: 'An error occurred while downloading contract' },
      { status: 500 }
    );
  }
}

