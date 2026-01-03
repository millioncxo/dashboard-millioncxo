import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Contract from '@/models/Contract';
import Client from '@/models/Client';
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

    // Fetch client information to get payment details
    const client = await Client.findById(clientId).lean();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch the most recent contract for the client
    const contract = await Contract.findOne({ clientId })
      .sort({ createdAt: -1 })
      .lean();

    // If no contract exists, create a contract object from client payment details
    if (!contract && client.paymentDetails) {
      const paymentDetails = client.paymentDetails as any;
      const contractData = {
        _id: `contract-${clientId}`,
        clientId: clientId,
        contractNumber: `CNT-${clientId.toString().substring(0, 8).toUpperCase()}`,
        startDate: paymentDetails.dealClosedDate || client.createdAt || new Date(),
        endDate: paymentDetails.dealClosedDate && paymentDetails.numberOfMonths
          ? new Date(new Date(paymentDetails.dealClosedDate).setMonth(new Date(paymentDetails.dealClosedDate).getMonth() + paymentDetails.numberOfMonths))
          : undefined,
        status: paymentDetails.dealClosedDate ? 'ACTIVE' : 'UPCOMING' as 'ACTIVE' | 'EXPIRED' | 'UPCOMING',
        terms: paymentDetails.paymentTerms || 'Standard service agreement terms apply.',
        billingCycle: paymentDetails.paymentTerms || 'Monthly',
        paymentTerms: paymentDetails.paymentTerms || 'Net 30',
        cancellationPolicy: 'Standard cancellation policy applies. Contact your account manager for details.',
        renewalTerms: 'Contract may be renewed upon mutual agreement.',
        createdAt: client.createdAt || new Date(),
        updatedAt: client.updatedAt || new Date(),
      };

      return NextResponse.json(
        {
          success: true,
          contract: contractData,
        },
        { status: 200 }
      );
    }

    if (!contract) {
      return NextResponse.json(
        { success: true, contract: null, message: 'No contract found' },
        { status: 200 }
      );
    }

    // Format contract to match frontend expectations
    const formattedContract = {
      ...contract,
      contractNumber: (contract as any).contractNumber || `CNT-${contract._id.toString().substring(0, 8).toUpperCase()}`,
      startDate: (contract as any).signedDate || contract.createdAt,
      endDate: (contract as any).endDate || undefined,
      status: (contract as any).status || 'ACTIVE' as 'ACTIVE' | 'EXPIRED' | 'UPCOMING',
      terms: (contract as any).terms || 'Standard service agreement terms apply.',
      billingCycle: (contract as any).billingCycle || 'Monthly',
      paymentTerms: (contract as any).paymentTerms || 'Net 30',
      serviceLevelAgreements: (contract as any).serviceLevelAgreements || {},
      cancellationPolicy: (contract as any).cancellationPolicy || 'Standard cancellation policy applies.',
      renewalTerms: (contract as any).renewalTerms || 'Contract may be renewed upon mutual agreement.',
      fileId: (contract as any).fileId || null, // GridFS file ID
      version: (contract as any).version || '1.0',
    };

    return NextResponse.json(
      {
        success: true,
        contract: formattedContract,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Client contract error:', error);

    // Handle authorization errors
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching contract data' },
      { status: 500 }
    );
  }
}

