import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import AdminNote from '@/models/AdminNote';
import { notifyAndEmail } from '@/lib/notify';
import Client from '@/models/Client';
import User from '@/models/User';

// Ensure models load for hot reload
if (typeof window === 'undefined') {
  void AdminNote;
  void Client;
  void User;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const notes = await AdminNote.find({ clientId: params.id })
      .populate('authorId', 'name email')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, notes }, { status: 200 });
  } catch (error: any) {
    console.error('Admin notes GET error:', error);
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const body = await req.json();
    const { content, tag, pinned = false } = body;

    if (!content || !tag) {
      return NextResponse.json({ error: 'Content and tag are required' }, { status: 400 });
    }
    if (!['ACCOUNT', 'BILLING', 'RISK'].includes(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 });
    }

    const note = await AdminNote.create({
      clientId: params.id,
      authorId: auth.userId,
      content,
      tag,
      pinned: !!pinned,
    });

    // Notify (email optional) based on tag
    const client = await Client.findById(params.id).lean();
    if (client) {
      const pocEmail = (client as any).pointOfContactEmail;
      await notifyAndEmail({
        type: 'ADMIN_NOTE',
        message: `Admin note [${tag}] for ${client.businessName}`,
        link: `/admin/overview/${params.id}`,
        email: pocEmail,
      });
    }

    const populated = await AdminNote.findById(note._id).populate('authorId', 'name email').lean();
    return NextResponse.json({ success: true, note: populated }, { status: 201 });
  } catch (error: any) {
    console.error('Admin notes POST error:', error);
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

