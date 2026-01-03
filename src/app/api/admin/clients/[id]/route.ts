import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import License from '@/models/License';
import SdrClientAssignment from '@/models/SdrClientAssignment';
import Plan from '@/models/Plan';
import { requireRole } from '@/lib/auth';
import { createOrUpdateInvoice } from '@/lib/invoice-generator';
import { validateObjectIdOrError } from '@/lib/validation';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { updateClientSchema, validateOrThrow } from '@/lib/validation-schemas';
import { ZodError } from 'zod';

// GET single client
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ObjectId
    const validationError = validateObjectIdOrError(params.id, 'client id');
    if (validationError) return validationError;

    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const client = await Client.findById(params.id)
      .populate('accountManagerId', 'name email')
      .populate('currentPlanId')
      .lean();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        client,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Get client error', error, { clientId: params.id });
    return handleApiError(error);
  }
}

// PUT/PATCH - Update client
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ObjectId
    const validationError = validateObjectIdOrError(params.id, 'client id');
    if (validationError) return validationError;

    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    // Fetch old client data to compare billing-relevant fields
    const oldClient = await Client.findById(params.id).lean();
    if (!oldClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // Validate request body with Zod
    let validatedData;
    try {
      validatedData = validateOrThrow(updateClientSchema, body);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errorMessages = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        return NextResponse.json(
          { error: errorMessages.join(', ') },
          { status: 400 }
        );
      }
      throw error;
    }
    
    const {
      businessName,
      pointOfContactName,
      pointOfContactTitle,
      pointOfContactEmail,
      additionalEmails,
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
      numberOfLicenses,
      numberOfSdrs,
      discountPercentage,
      paymentStatus,
      paymentDetails,
      targetThisMonth,
      achievedThisMonth,
      targetDeadline,
      positiveResponsesTarget,
      meetingsBookedTarget,
    } = validatedData;

    // Prepare update data - build object with only defined fields
    const updateData: any = {};
    
    if (businessName !== undefined && businessName !== null) updateData.businessName = businessName;
    if (pointOfContactName !== undefined && pointOfContactName !== null) updateData.pointOfContactName = pointOfContactName;
    if (pointOfContactTitle !== undefined) updateData.pointOfContactTitle = pointOfContactTitle;
    if (pointOfContactEmail !== undefined && pointOfContactEmail !== null) updateData.pointOfContactEmail = pointOfContactEmail.toLowerCase();
    if (additionalEmails !== undefined) updateData.additionalEmails = additionalEmails.map((e: string) => e.toLowerCase());
    if (pointOfContactPhone !== undefined) updateData.pointOfContactPhone = pointOfContactPhone;
    if (websiteAddress !== undefined) updateData.websiteAddress = websiteAddress;
    if (country !== undefined) updateData.country = country;
    if (fullRegisteredAddress !== undefined && fullRegisteredAddress !== null) updateData.fullRegisteredAddress = fullRegisteredAddress;
    if (accountManagerId !== undefined) updateData.accountManagerId = accountManagerId;
    if (currentPlanId !== undefined) updateData.currentPlanId = currentPlanId || null;
    if (customPlanName !== undefined) updateData.customPlanName = customPlanName || null;
    if (planType !== undefined) updateData.planType = planType;
    if (pricePerLicense !== undefined) updateData.pricePerLicense = pricePerLicense;
    if (currency !== undefined) updateData.currency = currency;
    if (numberOfLicenses !== undefined) updateData.numberOfLicenses = numberOfLicenses || 0;
    if (numberOfSdrs !== undefined) {
      // Validate numberOfSdrs - only allowed for SDR as a Service plans
      if (numberOfSdrs > 0) {
        const planId = currentPlanId !== undefined ? currentPlanId : (oldClient.currentPlanId?.toString() || null);
        if (planId) {
          const plan = await Plan.findById(planId).lean();
          if (plan) {
            const planConfig = plan.planConfiguration || {};
            if (!planConfig.requiresSdrCount) {
              return NextResponse.json(
                { error: 'numberOfSdrs can only be set for SDR as a Service plans' },
                { status: 400 }
              );
            }
          }
        }
        updateData.numberOfSdrs = numberOfSdrs;
      } else {
        // Allow clearing numberOfSdrs (set to undefined/remove)
        updateData.numberOfSdrs = undefined;
      }
    }
    if (discountPercentage !== undefined) {
      updateData.discountPercentage = Math.max(0, Math.min(100, discountPercentage || 0));
    }
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus; // Optional, deprecated
    if (targetThisMonth !== undefined) updateData.targetThisMonth = targetThisMonth;
    if (achievedThisMonth !== undefined) updateData.achievedThisMonth = achievedThisMonth;
    if (targetDeadline !== undefined) {
      updateData.targetDeadline = targetDeadline ? new Date(targetDeadline) : null;
    }
    if (positiveResponsesTarget !== undefined) {
      updateData.positiveResponsesTarget = Math.max(0, positiveResponsesTarget || 0);
    }
    if (meetingsBookedTarget !== undefined) {
      updateData.meetingsBookedTarget = Math.max(0, meetingsBookedTarget || 0);
    }

    // Always include payment details if provided (even if empty values)
    // Note: amountRequested is deprecated - calculated automatically from licenses and discount
    if (paymentDetails !== undefined) {
      updateData.paymentDetails = {
        // amountRequested is optional (deprecated, kept for backward compatibility)
        ...(paymentDetails.amountRequested !== undefined && { amountRequested: paymentDetails.amountRequested }),
        numberOfMonths: paymentDetails.numberOfMonths !== undefined ? paymentDetails.numberOfMonths : 1,
        paymentTerms: paymentDetails.paymentTerms || '',
        ...(paymentDetails.dealClosedDate && { dealClosedDate: new Date(paymentDetails.dealClosedDate) }),
        notes: paymentDetails.notes || '',
      };
    }

    // Build the $set object explicitly - ensure all fields are included
    const setData: any = {};
    
    // Copy all updateData fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        setData[key] = updateData[key];
      }
    });

    // Explicitly ensure these critical fields are set
    if (numberOfLicenses !== undefined) {
      setData.numberOfLicenses = numberOfLicenses;
    }
    if (paymentStatus !== undefined) {
      setData.paymentStatus = paymentStatus;
    }
    if (paymentDetails !== undefined) {
      setData.paymentDetails = updateData.paymentDetails;
    }

    console.log('🔧 Setting data in MongoDB:', JSON.stringify(setData, null, 2));

    // Use updateOne with explicit field setting - most reliable
    const updateResult = await Client.updateOne(
      { _id: params.id },
      { $set: setData },
      { runValidators: true }
    );

    console.log('📊 Update result:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged,
    });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (updateResult.modifiedCount === 0) {
      console.warn('⚠️  Update matched but no fields were modified');
    }

    // Auto-generate License records if numberOfLicenses increased
    if (numberOfLicenses !== undefined) {
      const existingLicensesCount = await License.countDocuments({ clientId: params.id });
      
      if (numberOfLicenses > existingLicensesCount) {
        const licensesToCreate = numberOfLicenses - existingLicensesCount;
        const newLicenseIds = [];
        
        for (let i = 1; i <= licensesToCreate; i++) {
          const newLicense = await License.create({
            clientId: params.id,
            productOrServiceName: `LinkedIn License ${existingLicensesCount + i}`,
            serviceType: 'LinkedIn Outreach',
            label: `License ${existingLicensesCount + i}`,
            status: 'active',
            startDate: new Date(),
          });
          newLicenseIds.push(newLicense._id);
        }
        console.log(`✅ Auto-generated ${licensesToCreate} license(s) for client ${params.id}`);
        
        // Auto-assign newly created licenses to existing SDR assignments for this client
        if (newLicenseIds.length > 0) {
          const existingAssignments = await SdrClientAssignment.find({ clientId: params.id });
          for (const assignment of existingAssignments) {
            // Add new licenses to existing assignment (avoid duplicates)
            const currentLicenseIds = (assignment.licenses || []).map((id: any) => id.toString());
            const newIds = newLicenseIds.map((id: any) => id.toString());
            const combinedIds = [...new Set([...currentLicenseIds, ...newIds])];
            
            await SdrClientAssignment.findByIdAndUpdate(
              assignment._id,
              { licenses: combinedIds },
              { new: true }
            );
          }
          if (existingAssignments.length > 0) {
            console.log(`✅ Auto-assigned ${newLicenseIds.length} new license(s) to ${existingAssignments.length} existing SDR assignment(s)`);
          }
        }
      }
    }

    // Fetch fresh with populated fields
    const client = await Client.findById(params.id)
      .populate('accountManagerId', 'name email')
      .populate('currentPlanId', 'name pricePerMonth creditsPerMonth description')
      .lean();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found after update' },
        { status: 404 }
      );
    }

    // Check if billing-relevant fields changed and generate/update invoice
    const billingFieldsChanged = 
      (currentPlanId !== undefined && currentPlanId !== (oldClient.currentPlanId?.toString() || null)) ||
      (numberOfLicenses !== undefined && numberOfLicenses !== (oldClient.numberOfLicenses || 0)) ||
      (numberOfSdrs !== undefined && numberOfSdrs !== ((oldClient as any).numberOfSdrs || 0));

    if (billingFieldsChanged && client.currentPlanId) {
      try {
        const plan = await Plan.findById(client.currentPlanId).lean();
        if (plan) {
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          
          // Update invoice for current month
          await createOrUpdateInvoice(
            client,
            plan,
            currentMonth,
            currentYear
          );
        }
      } catch (invoiceError: any) {
        // Log error but don't fail client update if invoice generation fails
        console.error('Failed to generate invoice during client update:', invoiceError);
      }
    }

    // Ensure all fields are explicitly included in response
    const clientData = {
      ...client,
      numberOfLicenses: (client as any).numberOfLicenses ?? updateData.numberOfLicenses ?? 0,
      paymentStatus: (client as any).paymentStatus ?? updateData.paymentStatus ?? 'PENDING',
      paymentDetails: (client as any).paymentDetails || updateData.paymentDetails || null,
    };

    // Return the updated client data
    return NextResponse.json(
      {
        success: true,
        message: 'Client updated successfully',
        client: clientData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Update client error', error, { clientId: params.id });
    return handleApiError(error);
  }
}

// DELETE client
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ObjectId
    const validationError = validateObjectIdOrError(params.id, 'client id');
    if (validationError) return validationError;

    await requireRole(['ADMIN'], req);
    await connectToDatabase();

    const client = await Client.findByIdAndDelete(params.id);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Client deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    logger.error('Delete client error', error, { clientId: params.id });
    return handleApiError(error);
  }
}

