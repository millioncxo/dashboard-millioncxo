import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    // Get all invoices with client information
    // Use populate with error handling
    console.log('[Invoices API] Fetching all invoices...');
    
    // First, try a raw count to see if ANY invoices exist
    const totalCount = await Invoice.countDocuments();
    console.log(`[Invoices API] Total invoice count in database: ${totalCount}`);
    
    // Also try without populate to see if that's the issue
    const rawInvoices = await Invoice.find().sort({ createdAt: -1 }).lean();
    console.log(`[Invoices API] Raw invoices found (without populate): ${rawInvoices.length}`);
    
    const invoices = await Invoice.find()
      .populate({
        path: 'clientId',
        select: 'businessName',
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[Invoices API] Found ${invoices.length} invoices in database`);
    if (invoices.length > 0) {
      console.log('[Invoices API] Sample invoice:', {
        _id: invoices[0]._id?.toString(),
        invoiceNumber: invoices[0].invoiceNumber,
        clientId: invoices[0].clientId?.toString(),
        status: invoices[0].status,
      });
    }

    // Format invoices for response
    // First, get all unique client IDs that need to be fetched
    const clientIdsToFetch = new Set<string>();
    invoices.forEach((invoice: any) => {
      if (invoice.clientId) {
        const clientIdStr = typeof invoice.clientId === 'object' && invoice.clientId._id 
          ? invoice.clientId._id.toString() 
          : invoice.clientId.toString();
        if (clientIdStr && (!invoice.clientId.businessName)) {
          clientIdsToFetch.add(clientIdStr);
        }
      }
    });

    // Fetch missing client names
    const clientMap = new Map<string, string>();
    if (clientIdsToFetch.size > 0) {
      const clients = await Client.find({
        _id: { $in: Array.from(clientIdsToFetch).map(id => new mongoose.Types.ObjectId(id)) }
      }).select('_id businessName').lean();
      
      clients.forEach((client: any) => {
        clientMap.set(client._id.toString(), client.businessName || 'Unknown Client');
      });
    }

    // Format invoices for response
    const formattedInvoices = invoices.map((invoice: any) => {
      // Handle case where clientId might not be populated or is null
      let clientIdData;
      if (invoice.clientId && typeof invoice.clientId === 'object' && invoice.clientId._id) {
        clientIdData = {
          _id: invoice.clientId._id.toString(),
          businessName: invoice.clientId.businessName || clientMap.get(invoice.clientId._id.toString()) || 'Unknown Client',
        };
      } else if (invoice.clientId) {
        // If clientId is just an ObjectId, fetch from map
        const clientIdStr = invoice.clientId.toString();
        clientIdData = {
          _id: clientIdStr,
          businessName: clientMap.get(clientIdStr) || 'Unknown Client',
        };
      } else {
        clientIdData = {
          _id: '',
          businessName: 'Unknown Client',
        };
      }

      return {
        _id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: clientIdData,
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
        createdAt: invoice.createdAt,
      };
    });

    console.log(`[Invoices API] Returning ${formattedInvoices.length} invoices`);
    
    return NextResponse.json(
      {
        success: true,
        invoices: formattedInvoices,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get invoices error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while fetching invoices' },
      { status: 500 }
    );
  }
}

