import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Plan from '@/models/Plan';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';
import { createOrUpdateInvoice } from '@/lib/invoice-generator';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both sync and async params (Next.js 14 vs 15)
  const resolvedParams = params instanceof Promise ? await params : params;
  
  console.log('[Invoice Generate API] ===== REQUEST RECEIVED =====');
  console.log('[Invoice Generate API] Raw params:', params);
  console.log('[Invoice Generate API] Resolved params:', resolvedParams);
  console.log('[Invoice Generate API] Client ID from params:', resolvedParams.id);
  
  try {
    // Verify admin role
    console.log('[Invoice Generate API] Verifying admin role...');
    await requireRole(['ADMIN'], req);
    console.log('[Invoice Generate API] Admin role verified');

    // Connect to database
    console.log('[Invoice Generate API] Connecting to database...');
    await connectToDatabase();
    console.log('[Invoice Generate API] Database connected');
    
    // Test: Check if we can query invoices
    const Invoice = (await import('@/models/Invoice')).default;
    const testCount = await Invoice.countDocuments();
    console.log(`[Invoice Generate API] Current invoice count in database: ${testCount}`);
    console.log(`[Invoice Generate API] Database name: ${mongoose.connection.db?.databaseName}`);
    console.log(`[Invoice Generate API] Invoice model collection name: ${Invoice.collection.name}`);

    // Get client ID from params
    const clientId = resolvedParams.id;
    console.log('[Invoice Generate API] Processing invoice generation for client:', clientId);

    // Verify client exists
    const clientDoc = await Client.findById(clientId);
    if (!clientDoc) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Convert to plain object to ensure _id and other fields are accessible
    const client = clientDoc.toObject ? clientDoc.toObject() : JSON.parse(JSON.stringify(clientDoc));

    // Get invoice data from request body
    console.log('[Invoice Generate API] Parsing request body...');
    const body = await req.json();
    console.log('[Invoice Generate API] Request body received:', body);
    
    const { 
      month, 
      year, 
      amountOverride, 
      description, 
      dueDate, 
      invoiceDate, 
      invoiceNumber, 
      paymentTerms, 
      notes 
    } = body;
    
    console.log('[Invoice Generate API] Extracted data:', {
      month,
      year,
      hasAmountOverride: !!amountOverride,
      hasDescription: !!description,
      hasDueDate: !!dueDate,
      hasInvoiceDate: !!invoiceDate,
    });

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Valid month (1-12) and year are required' },
        { status: 400 }
      );
    }

    // Verify client has a plan assigned
    const planId = client.currentPlanId?.toString ? client.currentPlanId.toString() : client.currentPlanId;
    if (!planId) {
      console.error(`[Invoice Generate API] Client ${clientId} has no plan assigned`);
      return NextResponse.json(
        { error: 'Client must have a plan assigned to generate invoice' },
        { status: 400 }
      );
    }

    // Fetch plan
    const plan = await Plan.findById(planId).lean();
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Prepare options object with optional fields
    const options: any = {};
    if (amountOverride !== undefined && amountOverride !== null && amountOverride !== '') {
      const overrideAmount = parseFloat(amountOverride);
      if (isNaN(overrideAmount) || overrideAmount < 0) {
        return NextResponse.json(
          { error: 'Invalid amount override. Must be a positive number.' },
          { status: 400 }
        );
      }
      options.amountOverride = overrideAmount;
    }
    if (description) options.description = description;
    if (dueDate) options.dueDate = new Date(dueDate);
    if (invoiceDate) options.invoiceDate = new Date(invoiceDate);
    if (invoiceNumber) options.invoiceNumber = invoiceNumber;
    if (paymentTerms) options.paymentTerms = paymentTerms;
    if (notes) options.notes = notes;

    // Generate invoice
    console.log(`[Invoice Generate API] Generating invoice for client ${clientId}, month ${month}/${year}`);
    console.log(`[Invoice Generate API] Client data:`, {
      clientId: client._id?.toString(),
      businessName: client.businessName,
      currentPlanId: client.currentPlanId?.toString(),
      currency: client.currency,
      numberOfLicenses: client.numberOfLicenses,
      numberOfSdrs: client.numberOfSdrs,
    });
    console.log(`[Invoice Generate API] Plan data:`, {
      planId: plan?._id?.toString(),
      planName: plan?.name,
      pricePerMonth: plan?.pricePerMonth,
    });
    
    const result = await createOrUpdateInvoice(
      client,
      plan,
      month,
      year,
      options
    );

    console.log(`[Invoice Generate API] Invoice generated successfully:`, {
      invoiceId: result.invoice._id?.toString(),
      invoiceNumber: result.invoice.invoiceNumber,
      clientId: result.invoice.clientId?.toString(),
      amount: result.invoice.amount,
      status: result.invoice.status,
    });

    // Verify invoice exists in database - try multiple methods
    console.log('[Invoice Generate API] Verifying invoice in database...');
    const invoiceId = result.invoice._id || result.invoice.id;
    console.log('[Invoice Generate API] Looking for invoice ID:', invoiceId);
    
    // Method 1: Find by ID
    const verifyInvoice = await Invoice.findById(invoiceId);
    console.log('[Invoice Generate API] FindById result:', verifyInvoice ? 'FOUND' : 'NOT FOUND');
    
    // Method 2: Find by clientId + month + year
    const verifyByQuery = await Invoice.findOne({
      clientId: client._id,
      invoiceMonth: month,
      invoiceYear: year,
    });
    console.log('[Invoice Generate API] FindOne by clientId/month/year result:', verifyByQuery ? 'FOUND' : 'NOT FOUND');
    
    // Method 3: Count all invoices
    const totalCount = await Invoice.countDocuments();
    console.log('[Invoice Generate API] Total invoices in database after creation:', totalCount);
    
    // Method 4: Direct database query
    const db = mongoose.connection.db;
    if (db) {
      const invoicesCollection = db.collection('invoices');
      const directQuery = await invoicesCollection.findOne({ _id: new mongoose.Types.ObjectId(invoiceId) });
      console.log('[Invoice Generate API] Direct database query result:', directQuery ? 'FOUND' : 'NOT FOUND');
      const directCount = await invoicesCollection.countDocuments();
      console.log('[Invoice Generate API] Direct collection count:', directCount);
    }
    
    if (!verifyInvoice && !verifyByQuery) {
      console.error('[Invoice Generate API] CRITICAL: Invoice was created but not found in database!');
      console.error('[Invoice Generate API] Invoice data that was returned:', JSON.stringify(result.invoice, null, 2));
      return NextResponse.json(
        { error: 'Invoice was created but could not be verified in database. Please check server logs.' },
        { status: 500 }
      );
    }
    
    const foundInvoice = verifyInvoice || verifyByQuery;
    if (!foundInvoice) {
      console.error('[Invoice Generate API] CRITICAL: Invoice was created but not found in database!');
      return NextResponse.json(
        { error: 'Invoice was created but could not be verified in database. Please check server logs.' },
        { status: 500 }
      );
    }
    console.log('[Invoice Generate API] Invoice verified in database:', foundInvoice._id?.toString() || foundInvoice.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice generated successfully',
        invoice: result.invoice,
        fileId: result.fileId,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const resolvedParams = params instanceof Promise ? await params : params;
    logger.error('Invoice generation error', error, { clientId: resolvedParams.id });
    return handleApiError(error);
  }
}

