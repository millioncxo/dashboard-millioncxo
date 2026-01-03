import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import Client from '@/models/Client';
import License from '@/models/License';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Update from '@/models/Update';
import Report from '@/models/Report';
import Plan from '@/models/Plan';
import User from '@/models/User';
import Invoice from '@/models/Invoice';
import mongoose from 'mongoose';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Client;
  void License;
  void SdrClientAssignment;
  void Update;
  void Report;
  void Plan;
  void User;
  void Invoice;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const clientId = params.id;
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: 'Invalid client id' }, { status: 400 });
    }

    // Fetch client with plan and account manager info
    const client = await Client.findById(clientId)
      .populate('currentPlanId', 'name pricePerMonth description')
      .populate('accountManagerId', 'name email')
      .lean();

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Licenses
    const licenses = await License.find({ clientId }).lean();

    // Assignments with SDR details
    const assignments = await SdrClientAssignment.find({ clientId })
      .populate('sdrId', 'name email')
      .lean();

    // Updates (recent)
    const updates = await Update.find({ clientId })
      .populate('sdrId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .lean();

    // Reports (recent)
    const reports = await Report.find({ clientId })
      .populate('createdBy', 'name email role')
      .populate('licenseId', 'productOrServiceName serviceType label')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Summary metrics
    const totalLicenses =
      licenses.length > 0 ? licenses.length : client.numberOfLicenses || 0;
    const updatesCount = await Update.countDocuments({ clientId });
    const reportsCount = await Report.countDocuments({ clientId });

    const totalTarget = client.targetThisMonth ?? client.numberOfLicenses ?? totalLicenses;
    const totalAchieved = client.achievedThisMonth ?? 0;

    // Payment history - all invoices
    const invoices = await Invoice.find({ clientId })
      .sort({ createdAt: -1 })
      .lean();

    // Payment summary
    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
    const paymentDates = paidInvoices
      .filter((inv) => inv.paidAt)
      .map((inv) => inv.paidAt)
      .sort((a, b) => (b as Date).getTime() - (a as Date).getTime());
    const lastPaymentDate = paymentDates.length > 0 ? paymentDates[0] : null;
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Achievement status calculation
    // If target is 0 or not set, show IN_PROGRESS (can't achieve a target that doesn't exist)
    // If target > 0 and achieved >= target, show ACHIEVED
    // If target > 0 and achieved < target and deadline passed, show OVERDUE
    // If target > 0 and achieved < target and deadline not passed, show IN_PROGRESS
    const deadlineDate = client.targetDeadline || null;
    const achievementStatus =
      totalTarget > 0 && totalAchieved >= totalTarget
        ? 'ACHIEVED'
        : totalTarget > 0 && totalAchieved < totalTarget && deadlineDate && new Date(deadlineDate) < new Date()
        ? 'OVERDUE'
        : 'IN_PROGRESS';

    // Plan data
    const planName =
      client.customPlanName ||
      (client.currentPlanId as any)?.name ||
      'No Plan Assigned';
    const planData = {
      name: planName,
      planType: client.planType || null,
      pricePerLicense: client.pricePerLicense ?? null,
      currency: client.currency || 'USD',
      numberOfLicenses: totalLicenses,
      totalCostOfService:
        client.pricePerLicense && totalLicenses
          ? client.pricePerLicense * totalLicenses
          : null,
    };

    // Shape data for response
    const responsePayload = {
      success: true,
      client: {
        id: client._id,
        businessName: client.businessName,
        pointOfContact: {
          name: client.pointOfContactName,
          title: client.pointOfContactTitle || null,
          email: client.pointOfContactEmail,
          phone: client.pointOfContactPhone || null,
        },
        websiteAddress: client.websiteAddress || null,
        country: client.country || null,
        fullRegisteredAddress: client.fullRegisteredAddress,
        accountManager:
          (client as any).accountManagerId || null, // already populated
        plan: planData,
        paymentStatus: client.paymentStatus || 'PENDING',
        paymentDetails: client.paymentDetails || null,
        targetDeadline: client.targetDeadline || null,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      licenses: licenses.map((lic) => ({
        id: lic._id,
        productOrServiceName: lic.productOrServiceName,
        serviceType: lic.serviceType,
        label: lic.label,
        status: lic.status,
        startDate: lic.startDate,
        endDate: lic.endDate || null,
        createdAt: lic.createdAt,
        updatedAt: lic.updatedAt,
      })),
      assignments: assignments.map((a) => ({
        id: a._id,
        sdr: a.sdrId
          ? {
              id: (a.sdrId as any)._id,
              name: (a.sdrId as any).name,
              email: (a.sdrId as any).email,
            }
          : null,
        licenses: a.licenses || [],
        linkedInChatHistory: a.linkedInChatHistory || null,
        chatHistoryAddedAt: a.chatHistoryAddedAt || null,
        chatHistoryUpdatedAt: a.chatHistoryUpdatedAt || null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      updates: updates.map((u) => ({
        id: u._id,
        type: u.type,
        title: u.title,
        description: u.description,
        date: u.date,
        sdr: u.sdrId
          ? {
              id: (u.sdrId as any)._id,
              name: (u.sdrId as any).name,
              email: (u.sdrId as any).email,
            }
          : null,
        readByClient: u.readByClient || false,
        readAt: u.readAt || null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      reports: reports.map((r) => ({
        id: r._id,
        type: r.type,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        summary: r.summary,
        metrics: r.metrics || {},
        inmailsSent: r.inMailsSent ?? 0,
        inmailsPositiveResponse: r.inMailsPositiveResponse ?? 0,
        connectionRequestsSent: r.connectionRequestsSent ?? 0,
        connectionRequestsPositiveResponse:
          r.connectionRequestsPositiveResponse ?? 0,
        createdBy: r.createdBy
          ? {
              id: (r.createdBy as any)._id,
              name: (r.createdBy as any).name,
              email: (r.createdBy as any).email,
              role: (r.createdBy as any).role,
            }
          : null,
        license:
          r.licenseId && (r.licenseId as any)._id
            ? {
                id: (r.licenseId as any)._id,
                productOrServiceName: (r.licenseId as any).productOrServiceName,
                serviceType: (r.licenseId as any).serviceType,
                label: (r.licenseId as any).label,
              }
            : null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      summary: {
        totalLicenses,
        totalTarget,
        totalAchieved,
        updatesCount,
        reportsCount,
        targetThisMonth: client.targetThisMonth ?? 0,
        achievedThisMonth: client.achievedThisMonth ?? 0,
        achievementStatus,
        deadlineDate,
      },
      paymentHistory: {
        invoices: invoices.map((inv) => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv._id.toString().substring(0, 8).toUpperCase()}`,
          invoiceDate: inv.invoiceDate || inv.createdAt,
          paymentDate: inv.paidAt || null,
          amount: inv.amount,
          currency: inv.currency || 'USD',
          status: inv.status,
          dueDate: inv.dueDate,
          description: inv.description || inv.typeOfService || 'Service Invoice',
          fileId: inv.fileId || null,
        })),
        paymentSummary: {
          totalInvoices: invoices.length,
          paidCount: paidInvoices.length,
          totalPaid,
          lastPaymentDate,
          paymentDates,
        },
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error('Admin overview detail error:', error);
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes('Unauthorized') ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: 'Failed to fetch admin overview detail' }, { status: 500 });
  }
}

