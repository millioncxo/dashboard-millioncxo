import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// Import all models to ensure they're registered with Mongoose
import Client from '@/models/Client';
import License from '@/models/License';
import Contract from '@/models/Contract';
import Plan from '@/models/Plan';
import Invoice from '@/models/Invoice';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import User from '@/models/User';
import { requireRole } from '@/lib/auth';
import { createOrUpdateInvoice } from '@/lib/invoice-generator';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { createClientSchema, validateOrThrow } from '@/lib/validation-schemas';

// Ensure models are registered (helps with Next.js hot reloading)
if (typeof window === 'undefined') {
  void Client;
  void License;
  void Invoice;
  void Plan;
  void User;
  void SdrClientAssignment;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Parse and validate request body
    const body = await req.json();
    const validatedData = validateOrThrow(createClientSchema, body);
    
    const {
      businessName,
      pointOfContactName,
      pointOfContactTitle,
      pointOfContactEmail,
      additionalEmails = [],
      pointOfContactPhone,
      websiteAddress,
      country,
      fullRegisteredAddress,
      accountManagerId,
      currentPlanId,
      customPlanName,
      planType,
      pricePerLicense,
      currency,
      numberOfLicenses = 0,
      numberOfSdrs,
      licenses = [],
      discountPercentage,
      paymentStatus,
      paymentDetails,
      positiveResponsesTarget,
      meetingsBookedTarget,
    } = validatedData;

    // Connect to database
    await connectToDatabase();

    // Validate numberOfSdrs - only allowed for SDR as a Service plans
    if (numberOfSdrs !== undefined && numberOfSdrs > 0 && currentPlanId) {
      const plan = await Plan.findById(currentPlanId).lean();
      if (!plan) {
        return NextResponse.json(
          { error: 'Selected plan not found' },
          { status: 400 }
        );
      }
      const planConfig = plan.planConfiguration || {};
      if (!planConfig.requiresSdrCount) {
        return NextResponse.json(
          { error: 'numberOfSdrs can only be set for SDR as a Service plans' },
          { status: 400 }
        );
      }
    }

    // Prepare payment details if provided
    // Note: amountRequested is deprecated - calculated automatically from licenses and discount
    let paymentDetailsData = undefined;
    if (paymentDetails) {
      paymentDetailsData = {
        // amountRequested is optional (deprecated, kept for backward compatibility)
        ...(paymentDetails.amountRequested !== undefined && { amountRequested: paymentDetails.amountRequested }),
        numberOfMonths: paymentDetails.numberOfMonths || 1,
        ...(paymentDetails.paymentTerms && { paymentTerms: paymentDetails.paymentTerms }),
        ...(paymentDetails.dealClosedDate && { dealClosedDate: new Date(paymentDetails.dealClosedDate) }),
        ...(paymentDetails.notes && { notes: paymentDetails.notes }),
      };
    }

    // Create new client
    const newClient = await Client.create({
      businessName,
      pointOfContactName,
      ...(pointOfContactTitle && { pointOfContactTitle }),
      pointOfContactEmail: pointOfContactEmail.toLowerCase(),
      ...(additionalEmails && additionalEmails.length > 0 && { additionalEmails: additionalEmails.map((e: string) => e.toLowerCase()) }),
      ...(pointOfContactPhone && { pointOfContactPhone }),
      ...(websiteAddress && { websiteAddress }),
      ...(country && { country }),
      fullRegisteredAddress,
      ...(accountManagerId && { accountManagerId }),
      ...(currentPlanId && { currentPlanId }),
      ...(customPlanName && { customPlanName }),
      ...(planType && { planType }),
      ...(pricePerLicense !== undefined && { pricePerLicense }),
      ...(currency && { currency }),
      numberOfLicenses,
      ...(numberOfSdrs !== undefined && numberOfSdrs > 0 && { numberOfSdrs }),
      ...(discountPercentage !== undefined && { discountPercentage: Math.max(0, Math.min(100, discountPercentage || 0)) }),
      ...(paymentDetailsData && { paymentDetails: paymentDetailsData }),
      ...(paymentStatus && { paymentStatus }), // Optional, deprecated
      ...(positiveResponsesTarget !== undefined && { positiveResponsesTarget: Math.max(0, positiveResponsesTarget || 0) }),
      ...(meetingsBookedTarget !== undefined && { meetingsBookedTarget: Math.max(0, meetingsBookedTarget || 0) }),
    });

    // Create licenses if provided
    const createdLicenses = [];
    if (licenses && licenses.length > 0) {
      for (const licenseData of licenses) {
        if (licenseData.productOrServiceName && licenseData.serviceType && licenseData.label) {
          const license = await License.create({
            clientId: newClient._id,
            productOrServiceName: licenseData.productOrServiceName,
            serviceType: licenseData.serviceType,
            label: licenseData.label,
            status: 'active',
            startDate: new Date(),
          });
          createdLicenses.push(license);
        }
      }
    }

    // Auto-generate License records if numberOfLicenses > 0 and no licenses provided
    if (numberOfLicenses > 0 && (!licenses || licenses.length === 0)) {
      for (let i = 1; i <= numberOfLicenses; i++) {
        const license = await License.create({
          clientId: newClient._id,
          productOrServiceName: `LinkedIn License ${i}`,
          serviceType: 'LinkedIn Outreach',
          label: `License ${i}`,
          status: 'active',
          startDate: new Date(),
        });
        createdLicenses.push(license);
      }
    }

    // Automatically generate invoice for current month if plan is assigned
    let generatedInvoice = null;
    if (currentPlanId) {
      try {
        const plan = await Plan.findById(currentPlanId).lean();
        if (plan) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          
          const result = await createOrUpdateInvoice(
            newClient,
            plan,
            currentMonth,
            currentYear
          );
          generatedInvoice = result.invoice;
        }
      } catch (invoiceError: any) {
        // Log error but don't fail client creation if invoice generation fails
        console.error('Failed to generate invoice during client creation:', invoiceError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Client created successfully',
        client: newClient,
        licenses: createdLicenses,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('Create client error', error);
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin role
    await requireRole(['ADMIN'], req);

    // Connect to database
    await connectToDatabase();

    // Use aggregation pipeline to avoid N+1 queries
    const clientsWithAssignments = await Client.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'accountManagerId',
          foreignField: '_id',
          as: 'accountManager',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'plans',
          localField: 'currentPlanId',
          foreignField: '_id',
          as: 'currentPlan',
          pipeline: [{ $project: { name: 1, pricePerMonth: 1, creditsPerMonth: 1, description: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'sdrclientassignments',
          localField: '_id',
          foreignField: 'clientId',
          as: 'assignments',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { sdrIds: '$assignments.sdrId' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$sdrIds'] },
              },
            },
            { $project: { name: 1, email: 1 } },
          ],
          as: 'sdrUsers',
        },
      },
      {
        $lookup: {
          from: 'contracts',
          localField: '_id',
          foreignField: 'clientId',
          as: 'contracts',
          pipeline: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 1, fileId: 1, version: 1, signedDate: 1, createdAt: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: 'invoices',
          let: { clientId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$clientId', '$$clientId'] },
                    { $ne: ['$fileId', null] },
                  ],
                },
              },
            },
            { $project: { _id: 1, invoiceNumber: 1, fileId: 1, createdAt: 1 } },
          ],
          as: 'invoicesWithFiles',
        },
      },
      {
        $addFields: {
          accountManagerId: { $arrayElemAt: ['$accountManager', 0] },
          currentPlanId: { $arrayElemAt: ['$currentPlan', 0] },
          sdrAssignments: {
            $map: {
              input: '$assignments',
              as: 'assignment',
              in: {
                $mergeObjects: [
                  '$$assignment',
                  {
                    sdrId: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$sdrUsers',
                            as: 'sdr',
                            cond: { $eq: ['$$sdr._id', '$$assignment.sdrId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
          contract: { $arrayElemAt: ['$contracts', 0] },
          numberOfLicenses: { $ifNull: ['$numberOfLicenses', 0] },
          paymentStatus: { $ifNull: ['$paymentStatus', 'PENDING'] },
          paymentDetails: { $ifNull: ['$paymentDetails', null] },
        },
      },
      {
        $project: {
          accountManager: 0,
          currentPlan: 0,
          sdrUsers: 0,
          contracts: 0,
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        clients: clientsWithAssignments,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get clients error', error);
    return handleApiError(error);
  }
}
