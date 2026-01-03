import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import { requireRole } from '@/lib/auth';
import { uploadFileToGridFS, validateFileType, validateFileSize } from '@/lib/gridfs';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Get client ID from params
    const clientId = params.id;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Valid month (1-12) and year are required' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (!validateFileType(file.name, file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (!validateFileSize(file.size, 10)) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 10MB.' },
        { status: 400 }
      );
    }

    // Calculate monthly payment amount from client data
    const baseCost = (client.pricePerLicense || 0) * (client.numberOfLicenses || 0);
    const discountPercent = client.discountPercentage || 0;
    const discountAmount = baseCost > 0 && discountPercent > 0 ? (baseCost * discountPercent) / 100 : 0;
    const finalCost = baseCost - discountAmount;
    const numberOfMonths = client.paymentDetails?.numberOfMonths || 1;
    const monthlyAmount = numberOfMonths > 0 ? finalCost / numberOfMonths : finalCost;

    // Create invoice date (first day of the month)
    const invoiceDate = new Date(year, month - 1, 1);
    // Due date is end of the month
    const dueDate = new Date(year, month, 0); // Last day of the month

    // Find or create invoice for this month/year
    let invoice = await Invoice.findOne({
      clientId: new mongoose.Types.ObjectId(clientId),
      invoiceMonth: month,
      invoiceYear: year,
    });

    if (!invoice) {
      // Create new invoice for this month
      invoice = await Invoice.create({
        clientId: new mongoose.Types.ObjectId(clientId),
        invoiceNumber: `INV-${client.businessName.substring(0, 3).toUpperCase()}-${year}-${String(month).padStart(2, '0')}`,
        typeOfService: client.customPlanName || client.planType || 'Service',
        numberOfServices: client.numberOfLicenses || 1,
        amount: monthlyAmount,
        currency: client.currency || 'USD',
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        invoiceMonth: month,
        invoiceYear: year,
        status: 'GENERATED',
        description: `Monthly invoice for ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      });
    } else {
      // Update existing invoice amount if client details changed
      invoice.amount = monthlyAmount;
      invoice.invoiceDate = invoiceDate;
      invoice.dueDate = dueDate;
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GridFS
    const fileId = await uploadFileToGridFS(buffer, file.name, {
      clientId: clientId,
      invoiceId: invoice._id.toString(),
      type: 'invoice',
      uploadedBy: 'admin',
      uploadedAt: new Date().toISOString(),
      month: month,
      year: year,
    });

    // Update invoice with file ID
    invoice.fileId = fileId;
    await invoice.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice uploaded successfully',
        fileId,
        invoiceId: invoice._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Invoice upload error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while uploading invoice' },
      { status: 500 }
    );
  }
}

