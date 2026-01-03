import PDFDocument from 'pdfkit';
import Client from '@/models/Client';
import Plan from '@/models/Plan';
import Invoice from '@/models/Invoice';
import { uploadFileToGridFS } from './gridfs';
import mongoose from 'mongoose';

// PDFKit uses built-in fonts (Helvetica, Times-Roman, Courier) by default
// No custom font path configuration needed - these fonts work out of the box

export interface InvoiceCalculationResult {
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  monthlyAmount: number;
  description: string;
}

/**
 * Calculate invoice amount based on client plan, licenses, SDRs, and discount
 */
export async function calculateInvoiceAmount(
  client: any,
  plan: any
): Promise<InvoiceCalculationResult> {
  let baseAmount = 0;
  let description = '';

  // Get plan configuration if available
  const planConfig = plan?.planConfiguration || {};

  // Calculate base amount based on plan type
  if (planConfig.requiresSdrCount && client.numberOfSdrs) {
    // SDR as a Service: numberOfSdrs × pricePerSdr
    const pricePerSdr = planConfig.pricePerSdr || client.pricePerLicense || plan?.pricePerMonth || 2000;
    baseAmount = client.numberOfSdrs * pricePerSdr;
    description = `${plan?.name || 'SDR as a Service'} - ${client.numberOfSdrs} SDR${client.numberOfSdrs > 1 ? 's' : ''}`;
  } else if (planConfig.requiresLicenseCount || plan?.name === 'LinkedIn Outreach Excellence 20X') {
    // License-based: numberOfLicenses × pricePerLicense
    const pricePerLicense = planConfig.pricePerLicense || client.pricePerLicense || plan?.pricePerMonth || 250;
    baseAmount = (client.numberOfLicenses || 0) * pricePerLicense;
    description = `${plan?.name || 'LinkedIn Outreach Excellence 20X'} - ${client.numberOfLicenses || 0} License${(client.numberOfLicenses || 0) !== 1 ? 's' : ''}`;
  } else {
    // Fixed-price plan (e.g., LinkedIn Followers Boost)
    baseAmount = plan?.pricePerMonth || client.pricePerLicense || 0;
    description = plan?.name || 'Service';
  }

  // Apply discount
  const discountPercent = client.discountPercentage || 0;
  const discountAmount = baseAmount > 0 && discountPercent > 0 ? (baseAmount * discountPercent) / 100 : 0;
  const finalAmount = baseAmount - discountAmount;

  // Calculate monthly amount
  const numberOfMonths = client.paymentDetails?.numberOfMonths || 1;
  const monthlyAmount = numberOfMonths > 0 ? finalAmount / numberOfMonths : finalAmount;

  return {
    baseAmount,
    discountAmount,
    finalAmount,
    monthlyAmount,
    description,
  };
}

/**
 * Generate branded PDF invoice
 */
export async function generateBrandedInvoicePDF(
  client: any,
  invoice: any,
  calculation: InvoiceCalculationResult,
  options?: {
    invoiceNumber?: string;
    invoiceDate?: Date;
    dueDate?: Date;
    paymentTerms?: string;
    notes?: string;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with default fonts (Helvetica, Times-Roman, Courier)
      // PDFKit includes these fonts by default, no custom font path needed
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'LETTER'
      });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Company branding colors
      const primaryColor = '#0B2E2B'; // Imperial Emerald
      const accentColor = '#C4B75B'; // Golden Opal
      const textColor = '#2D4A47'; // Muted Jade

      // Header with company branding
      doc
        .fillColor(primaryColor)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('MillionCXO', 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .fillColor(textColor)
        .text('Invoice', 50, 80);

      doc
        .strokeColor(accentColor)
        .lineWidth(1)
        .moveTo(50, 100)
        .lineTo(550, 100)
        .stroke();

      // Invoice details (right side)
      const invoiceNumber = options?.invoiceNumber || invoice.invoiceNumber || `INV-${invoice._id.toString().substring(0, 8).toUpperCase()}`;
      const invoiceDate = options?.invoiceDate || invoice.invoiceDate || invoice.createdAt || new Date();
      const dueDate = options?.dueDate || invoice.dueDate || new Date();

      doc
        .fontSize(10)
        .fillColor(textColor)
        .text(`Invoice #: ${invoiceNumber}`, 400, 50, { align: 'right' })
        .text(`Date: ${new Date(invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 400, 65, { align: 'right' })
        .text(`Due Date: ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 400, 80, { align: 'right' });

      // Bill To section - use relative positioning for proper text wrapping
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Bill To:', 50, 130);

      // Set position for Bill To content
      doc.y = 152;
      doc.x = 50;
      
      // Business Name
      if (client.businessName) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(textColor)
          .text(client.businessName, { width: 300 });
        doc.moveDown(1);
      }

      // Address - will wrap automatically
      if (client.fullRegisteredAddress) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(textColor)
          .text(client.fullRegisteredAddress, { width: 300 });
        doc.moveDown(1);
      }

      // Contact Name
      if (client.pointOfContactName) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(textColor)
          .text(`Contact: ${client.pointOfContactName}`);
        doc.moveDown(1);
      }
      
      // Email
      if (client.pointOfContactEmail) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(textColor)
          .text(`Email: ${client.pointOfContactEmail}`);
        doc.moveDown(1);
      }

      // Get final Y position for next section and add spacing
      let currentY = doc.y + 20;

      // Service details section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Service Details', 50, currentY);

      // Table configuration
      const tableTop = currentY + 20;
      const col1X = 60; // Description
      const col2X = 320; // Quantity
      const col3X = 400; // Unit Price
      const col4X = 480; // Amount
      const tableWidth = 500;

      // Table header background
      doc
        .rect(50, tableTop, tableWidth, 25)
        .fill(accentColor);

      // Table header text
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', col1X, tableTop + 8)
        .text('Qty', col2X, tableTop + 8)
        .text('Unit Price', col3X, tableTop + 8)
        .text('Total', col4X, tableTop + 8, { width: 60, align: 'right' });

      // Service row
      const rowY = tableTop + 35;
      const quantity = client.numberOfSdrs || client.numberOfLicenses || 1;
      const unitPrice = calculation.baseAmount / (quantity || 1);

      // Use a fixed row height that accommodates wrapped text
      const rowHeight = 30;

      doc
        .fillColor(textColor)
        .font('Helvetica')
        .fontSize(10)
        .text(calculation.description, col1X, rowY, { width: 250 })
        .text(quantity.toString(), col2X, rowY)
        .text(`${client.currency || 'USD'} ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, col3X, rowY)
        .text(`${client.currency || 'USD'} ${calculation.baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, col4X, rowY, { width: 60, align: 'right' });

      // Move Y down based on row height
      currentY = rowY + rowHeight;

      // Discount row (if applicable)
      if (calculation.discountAmount > 0) {
        doc
          .fillColor(textColor)
          .text(`Discount (${client.discountPercentage || 0}%)`, col1X, currentY)
          .text(`-${client.currency || 'USD'} ${calculation.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, col4X, currentY, { width: 60, align: 'right' });
        currentY += 20;
      }

      // Total Amount row
      doc
        .rect(50, currentY, tableWidth, 30)
        .fill(accentColor);

      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Total Invoice Amount', col1X, currentY + 9)
        .text(`${client.currency || 'USD'} ${calculation.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, col4X - 20, currentY + 9, { width: 80, align: 'right' });

      // Payment terms
      currentY += 50;
      const paymentTermsText = options?.paymentTerms || client.paymentDetails?.paymentTerms || 'Net 30';
      
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('Payment Terms:', 50, currentY);

      currentY += 18;
      
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(textColor)
        .text(paymentTermsText, 50, currentY);

      if (client.paymentDetails?.numberOfMonths && client.paymentDetails.numberOfMonths > 1) {
        currentY += 18;
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(textColor)
          .text(`Monthly Payment: ${client.currency || 'USD'} ${calculation.monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, currentY);
      }

      // Notes section (if provided)
      if (options?.notes) {
        currentY += 30;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('Notes:', 50, currentY);
        
        currentY += 18;
        
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(textColor)
          .text(options.notes, 50, currentY, { width: 500 });
      }

      // Footer
      const pageHeight = doc.page.height;
      doc
        .strokeColor(accentColor)
        .lineWidth(0.5)
        .moveTo(50, pageHeight - 70)
        .lineTo(550, pageHeight - 70)
        .stroke();

      doc
        .fontSize(8)
        .fillColor(textColor)
        .text('Thank you for your business!', 50, pageHeight - 50, { align: 'center' })
        .text('MillionCXO - Professional SDR Services', 50, pageHeight - 35, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get or create invoice for a specific month/year
 */
export async function getInvoiceForMonth(
  clientId: string,
  month: number,
  year: number
): Promise<any | null> {
  const invoice = await Invoice.findOne({
    clientId: new mongoose.Types.ObjectId(clientId),
    invoiceMonth: month,
    invoiceYear: year,
  }).lean();

  return invoice;
}

/**
 * Create or update invoice for client
 */
export async function createOrUpdateInvoice(
  client: any,
  plan: any,
  month: number,
  year: number,
  options?: {
    invoiceNumber?: string;
    description?: string;
    amountOverride?: number;
    invoiceDate?: Date;
    dueDate?: Date;
    paymentTerms?: string;
    notes?: string;
  }
): Promise<{ invoice: any; fileId: string }> {
  // Calculate invoice amount
  const calculation = await calculateInvoiceAmount(client, plan);
  const invoiceAmount = options?.amountOverride || calculation.monthlyAmount;

  // Check if invoice exists for this month
  const existingInvoice = await getInvoiceForMonth(client._id.toString(), month, year);

  // Generate invoice date and due date (use provided or defaults)
  const invoiceDate = options?.invoiceDate || new Date(year, month - 1, 1); // First day of month
  const dueDate = options?.dueDate || new Date(year, month, 0); // Last day of month

  // Generate invoice number if not provided
  const invoiceNumber = options?.invoiceNumber || 
    existingInvoice?.invoiceNumber ||
    `INV-${client.businessName.substring(0, 3).toUpperCase()}-${year}-${String(month).padStart(2, '0')}`;

  // Generate PDF
  const pdfBuffer = await generateBrandedInvoicePDF(
    client,
    existingInvoice || { _id: new mongoose.Types.ObjectId() },
    calculation,
    {
      invoiceNumber,
      invoiceDate,
      dueDate,
      paymentTerms: options?.paymentTerms,
      notes: options?.notes,
    }
  );

  // Upload PDF to GridFS
  const filename = `invoice-${invoiceNumber}-${year}-${month}.pdf`;
  const fileId = await uploadFileToGridFS(pdfBuffer, filename, {
    clientId: client._id.toString(),
    invoiceNumber,
    month,
    year,
  });

  // Create or update invoice record
  let invoice;
  if (existingInvoice) {
    // Update existing invoice
    invoice = await Invoice.findByIdAndUpdate(
      existingInvoice._id,
      {
        amount: invoiceAmount,
        currency: client.currency || 'USD',
        invoiceDate,
        dueDate,
        fileId,
        description: options?.description || calculation.description,
        status: 'GENERATED',
        ...(options?.notes && { notes: options.notes }),
        ...(options?.paymentTerms && { paymentTerms: options.paymentTerms }),
      },
      { new: true }
    );
  } else {
    // Create new invoice - ensure clientId is ObjectId
    const clientIdObj = typeof client._id === 'string' 
      ? new mongoose.Types.ObjectId(client._id) 
      : client._id;
    
    // Validate required fields before creation
    const typeOfService = plan?.name || calculation.description || 'Service';
    const numberOfServices = client.numberOfSdrs || client.numberOfLicenses || 1;
    const currency = client.currency || 'USD';
    
    if (!typeOfService || typeOfService.trim() === '') {
      throw new Error('Type of service is required but was empty');
    }
    if (numberOfServices < 1) {
      throw new Error(`Number of services must be at least 1, got: ${numberOfServices}`);
    }
    if (invoiceAmount < 0 || isNaN(invoiceAmount)) {
      throw new Error(`Invalid invoice amount: ${invoiceAmount}`);
    }
    if (!dueDate || !(dueDate instanceof Date)) {
      throw new Error(`Invalid due date: ${dueDate}`);
    }
    
    console.log('[Invoice Generator] Creating invoice with data:', {
      clientId: clientIdObj.toString(),
      invoiceNumber,
      typeOfService,
      numberOfServices,
      amount: invoiceAmount,
      currency,
      invoiceDate: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      invoiceMonth: month,
      invoiceYear: year,
      fileId,
    });
    
    try {
      // Create invoice document
      const invoiceData = {
        clientId: clientIdObj,
        invoiceNumber,
        typeOfService: typeOfService.trim(),
        numberOfServices,
        amount: invoiceAmount,
        currency: currency.toUpperCase(),
        invoiceDate,
        dueDate,
        invoiceMonth: month,
        invoiceYear: year,
        status: 'GENERATED' as const,
        fileId,
        description: options?.description || calculation.description,
        ...(options?.notes && { notes: options.notes }),
        ...(options?.paymentTerms && { paymentTerms: options.paymentTerms }),
      };
      
      console.log('[Invoice Generator] Invoice data to save:', invoiceData);
      
      // Create invoice
      invoice = await Invoice.create(invoiceData);
      
      // Force save and wait for it to complete
      if (invoice.save) {
        await invoice.save();
      }
      
      // Verify invoice was actually saved by querying it back immediately
      const savedInvoice = await Invoice.findById(invoice._id).lean();
      if (!savedInvoice) {
        throw new Error('Invoice was created but could not be retrieved from database');
      }
      
      // Also verify by querying with clientId and month/year
      const verifyQuery = await Invoice.findOne({
        clientId: clientIdObj,
        invoiceMonth: month,
        invoiceYear: year,
      }).lean();
      
      if (!verifyQuery) {
        throw new Error('Invoice was created but query by clientId/month/year returned nothing');
      }
      
      console.log(`[Invoice Generator] Invoice created and verified in database:`, {
        invoiceId: invoice._id?.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: clientIdObj.toString(),
        amount: invoice.amount,
        status: invoice.status,
        verifiedById: savedInvoice._id?.toString(),
        verifiedByQuery: verifyQuery._id?.toString(),
      });
    } catch (createError: any) {
      console.error('[Invoice Generator] Error creating invoice:', {
        error: createError.message,
        code: createError.code,
        name: createError.name,
        errors: createError.errors,
        stack: createError.stack,
      });
      
      if (createError.code === 11000) {
        // Duplicate key error - invoice might already exist
        console.log('[Invoice Generator] Duplicate invoice detected, attempting to fetch existing...');
        const existing = await Invoice.findOne({
          clientId: clientIdObj,
          invoiceMonth: month,
          invoiceYear: year,
        });
        if (existing) {
          console.log('[Invoice Generator] Found existing invoice, updating instead');
          // Update the existing invoice
          invoice = await Invoice.findByIdAndUpdate(
            existing._id,
            {
              amount: invoiceAmount,
              currency: currency.toUpperCase(),
              invoiceDate,
              dueDate,
              fileId,
              description: options?.description || calculation.description,
              status: 'GENERATED',
              ...(options?.notes && { notes: options.notes }),
              ...(options?.paymentTerms && { paymentTerms: options.paymentTerms }),
            },
            { new: true }
          );
          
          if (!invoice) {
            throw new Error('Failed to update existing invoice');
          }
        } else {
          throw new Error(`Failed to create invoice (duplicate key error but invoice not found): ${createError.message}`);
        }
      } else if (createError.errors) {
        // Validation errors
        const validationErrors = Object.keys(createError.errors).map(key => ({
          field: key,
          message: createError.errors[key].message,
        }));
        throw new Error(`Invoice validation failed: ${JSON.stringify(validationErrors)}`);
      } else {
        throw new Error(`Failed to create invoice: ${createError.message || createError.toString()}`);
      }
    }
  }

  // Ensure invoice is populated/returned properly
  if (!invoice) {
    throw new Error('Failed to create or update invoice');
  }

  // Convert to plain object for consistent return format
  const invoiceObj = invoice.toObject ? invoice.toObject() : invoice;
  
  console.log(`[Invoice Generator] Invoice ${existingInvoice ? 'updated' : 'created'}:`, {
    invoiceId: invoiceObj._id?.toString(),
    invoiceNumber: invoiceObj.invoiceNumber,
    clientId: invoiceObj.clientId?.toString(),
    month,
    year,
    amount: invoiceObj.amount,
  });

  return { invoice: invoiceObj, fileId };
}

