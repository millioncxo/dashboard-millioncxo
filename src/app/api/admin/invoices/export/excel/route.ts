import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Invoice from '@/models/Invoice';
import { requireRole } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    
    // Optional filters
    const statusFilter = searchParams.get('status');
    const clientFilter = searchParams.get('clientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    const query: any = {};
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (clientFilter) {
      query.clientId = clientFilter;
    }
    if (dateFrom || dateTo) {
      query.invoiceDate = {};
      if (dateFrom) {
        query.invoiceDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.invoiceDate.$lte = new Date(dateTo);
      }
    }

    // Fetch invoices
    const invoices = await Invoice.find(query)
      .populate('clientId', 'businessName')
      .sort({ invoiceDate: -1, createdAt: -1 })
      .lean();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    // Define columns
    worksheet.columns = [
      { header: 'Invoice #', key: 'invoiceNumber', width: 20 },
      { header: 'Client', key: 'clientName', width: 30 },
      { header: 'Invoice Date', key: 'invoiceDate', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Date', key: 'paymentDate', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC4B75B' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    invoices.forEach((invoice: any) => {
      const clientName = invoice.clientId?.businessName || 'Unknown Client';
      const invoiceDate = invoice.invoiceDate 
        ? new Date(invoice.invoiceDate).toLocaleDateString()
        : invoice.createdAt 
        ? new Date(invoice.createdAt).toLocaleDateString()
        : '';
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '';
      const paymentDate = invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '';

      worksheet.addRow({
        invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id.toString().substring(0, 8)}`,
        clientName,
        invoiceDate,
        dueDate,
        amount: invoice.amount || 0,
        currency: invoice.currency || 'USD',
        status: invoice.status || 'GENERATED',
        paymentDate,
        description: invoice.description || '',
      });
    });

    // Format amount column
    worksheet.getColumn('amount').numFmt = '#,##0.00';

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return file as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="invoices-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Excel export error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while exporting invoices to Excel' },
      { status: 500 }
    );
  }
}

