import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Contract from '@/models/Contract';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import { uploadFileToGridFS, validateFileType, validateFileSize } from '@/lib/gridfs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();
    return NextResponse.json(
      { error: 'Contract upload has been disabled by admin policy' },
      { status: 410 }
    );
  } catch (error: any) {
    console.error('Contract upload error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while uploading contract' },
      { status: 500 }
    );
  }
}

