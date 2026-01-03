import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    // Get all clients
    const clients = await Client.find()
      .populate('accountManagerId', 'name email')
      .populate('currentPlanId', 'name')
      .lean();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Business Name',
        'Contact Name',
        'Contact Email',
        'Contact Phone',
        'Country',
        'Address',
        'Plan',
        'Licenses',
        'Currency',
        'Price Per License',
        'Total Cost',
        'Discount %',
        'Final Cost',
        'Status',
        'Created Date',
      ];

      const rows = clients.map((client: any) => {
        const baseCost = (client.numberOfLicenses || 0) * (client.pricePerLicense || 0);
        const discountPercent = client.discountPercentage || 0;
        const discountAmount = baseCost > 0 && discountPercent > 0 ? (baseCost * discountPercent) / 100 : 0;
        const finalCost = baseCost - discountAmount;

        return [
          client.businessName || '',
          client.pointOfContactName || '',
          client.pointOfContactEmail || '',
          client.pointOfContactPhone || '',
          client.country || '',
          client.fullRegisteredAddress || '',
          client.currentPlanId?.name || 'N/A',
          (client.numberOfLicenses || 0).toString(),
          client.currency || 'USD',
          (client.pricePerLicense || 0).toFixed(2),
          baseCost.toFixed(2),
          discountPercent.toString(),
          finalCost.toFixed(2),
          client.paymentStatus || 'PENDING',
          new Date(client.createdAt).toLocaleDateString(),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="clients-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json(
      {
        success: true,
        clients: clients.map((client: any) => ({
          businessName: client.businessName,
          contactName: client.pointOfContactName,
          contactEmail: client.pointOfContactEmail,
          contactPhone: client.pointOfContactPhone,
          country: client.country,
          address: client.fullRegisteredAddress,
          plan: client.currentPlanId?.name,
          licenses: client.numberOfLicenses || 0,
          currency: client.currency || 'USD',
          pricePerLicense: client.pricePerLicense || 0,
          discountPercentage: client.discountPercentage || 0,
          paymentStatus: client.paymentStatus || 'PENDING',
          createdAt: client.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Export clients error:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while exporting clients' },
      { status: 500 }
    );
  }
}

