import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Update from '@/models/Update';
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

    // Get initial chat history from assignment
    const assignment = await SdrClientAssignment.findOne({ clientId })
      .populate('sdrId', 'name email')
      .lean();

    // Get additional chat history from updates
    const updatesWithChat = await Update.find({
      clientId,
      chatHistory: { $exists: true, $nin: [null, ''] },
    })
      .populate('sdrId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Format chat history entries
    const chatHistoryEntries = [];

    // Add initial conversation from assignment
    if (assignment && assignment.linkedInChatHistory) {
      chatHistoryEntries.push({
        type: 'initial',
        chatHistory: assignment.linkedInChatHistory,
        addedAt: assignment.chatHistoryAddedAt || assignment.createdAt,
        updatedAt: assignment.chatHistoryUpdatedAt || assignment.createdAt,
        sdr: assignment.sdrId ? {
          name: (assignment.sdrId as any).name,
          email: (assignment.sdrId as any).email,
        } : null,
      });
    }

    // Add additional conversations from updates
    updatesWithChat.forEach((update: any) => {
      chatHistoryEntries.push({
        type: 'update',
        chatHistory: update.chatHistory,
        addedAt: update.createdAt,
        updatedAt: update.updatedAt,
        updateTitle: update.title,
        updateType: update.type,
        updateDate: update.date,
        sdr: update.sdrId ? {
          name: (update.sdrId as any).name,
          email: (update.sdrId as any).email,
        } : null,
      });
    });

    // Sort by date (newest first)
    chatHistoryEntries.sort((a, b) => {
      const dateA = new Date(a.addedAt).getTime();
      const dateB = new Date(b.addedAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(
      {
        success: true,
        chatHistory: chatHistoryEntries,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client chat history error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching chat history' },
      { status: 500 }
    );
  }
}

